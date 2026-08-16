import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';

// Mock prisma with an interactive-transaction-capable client
function makeTx() {
  return {
    question: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'q1', score: 1 }),
      updateMany: jest.fn(),
    },
    questionVote: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    answer: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    answerVote: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  };
}

jest.mock('@repo/database', () => {
  const tx = makeTx();
  return {
    prisma: {
      ...tx,
      question: { ...tx.question, create: jest.fn(), delete: jest.fn(), count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
      answer: { ...tx.answer, create: jest.fn().mockResolvedValue({ id: 'a1' }), delete: jest.fn() },
      report: { create: jest.fn() },
      questionFollow: { findUnique: jest.fn(), delete: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(async (arg: any) => {
        if (typeof arg === 'function') return arg(tx);
        return Promise.all(arg);
      }),
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

describe('P1-K: Q&A service', () => {
  let service: QuestionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuestionsService();
  });

  describe('voting', () => {
    it('first upvote increments the score by 1 and stores the vote row', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ authorId: 'author', isLocked: false });
      (prisma.questionVote.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.question.update as jest.Mock).mockResolvedValue({ score: 1 });

      const res = await service.voteQuestion('voter', 'q1', 1);

      expect(res).toEqual({ score: 1, changed: true });
      expect(prisma.questionVote.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { questionId: 'q1', userId: 'voter', value: 1 } }),
      );
    });

    it('same vote twice is a NO-OP (idempotent, no double count)', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ authorId: 'author', isLocked: false });
      (prisma.questionVote.findUnique as jest.Mock).mockResolvedValue({ id: 'v1', value: 1 });

      const res = await service.voteQuestion('voter', 'q1', 1);

      expect(res.changed).toBe(false);
      expect(prisma.questionVote.delete).not.toHaveBeenCalled();
      expect(prisma.question.update).not.toHaveBeenCalled();
    });

    it('flipping the vote applies the correct ±2 delta', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ authorId: 'author', isLocked: false });
      (prisma.questionVote.findUnique as jest.Mock).mockResolvedValue({ id: 'v1', value: 1 });
      (prisma.question.update as jest.Mock).mockResolvedValue({ score: -1 });

      await service.voteQuestion('voter', 'q1', -1);

      const call = (prisma.question.update as jest.Mock).mock.calls[0][0];
      expect(call.data.score).toEqual({ increment: -2 });
    });

    it('the author cannot vote for their own question', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ authorId: 'me', isLocked: false });
      await expect(service.voteQuestion('me', 'q1', 1)).rejects.toThrow(ForbiddenException);
    });

    it('locked questions cannot be voted on', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ authorId: 'author', isLocked: true });
      await expect(service.voteQuestion('voter', 'q1', 1)).rejects.toThrow('verrouillée');
    });
  });

  describe('accept answer', () => {
    it('ONLY the question author can accept', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', authorId: 'author' });
      await expect(service.acceptAnswer('intruder', 'q1', 'a1')).rejects.toThrow(
        'Seul l’auteur',
      );
    });

    it('an answer from ANOTHER question is rejected', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', authorId: 'author' });
      (prisma.answer.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', questionId: 'other' });

      await expect(service.acceptAnswer('author', 'q1', 'a1')).rejects.toThrow(BadRequestException);
    });

    it('accepting clears previous accepted answers (single accepted)', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', authorId: 'author' });
      (prisma.answer.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', questionId: 'q1' });

      await service.acceptAnswer('author', 'q1', 'a1');

      expect(prisma.answer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { questionId: 'q1', isAccepted: true } }),
      );
    });
  });

  describe('questions', () => {
    it('creates with slugified unique slug and max 5 lowercase tags', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.question.create as jest.Mock).mockResolvedValue({});

      await service.createQuestion('u1', {
        title: 'How do I spot an X-Wing pattern?',
        body: 'I learned naked pairs but the X-Wing escapes me entirely, help please.',
        tags: ['X-Wing', 'TECHNIQUES', 'a', 'b', 'c', 'd', 'e'],
      });

      const call = (prisma.question.create as jest.Mock).mock.calls[0][0];
      expect(call.data.slug).toBe('how-do-i-spot-an-x-wing-pattern');
      expect(call.data.tags).toHaveLength(5);
      expect(call.data.tags[0]).toBe('x-wing');
    });

    it('validation: title too short rejected', async () => {
      await expect(
        service.createQuestion('u1', { title: 'short', body: 'x'.repeat(30), tags: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('non-author cannot edit (moderators can)', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', authorId: 'author', isLocked: false });
      await expect(
        service.updateQuestion('other', 'q1', { body: 'hacked'.repeat(5) }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateQuestion('mod', 'q1', { body: 'cleaned'.repeat(5) }, true),
      ).resolves.toBeDefined();
    });
  });

  describe('answers', () => {
    it('answering a CLOSED question is forbidden', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', isClosed: true });
      await expect(service.createAnswer('u1', 'q1', 'my answer here')).rejects.toThrow('fermée');
    });

    it('answering increments answerCount and bumps lastActivity in one transaction', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', isClosed: false, isLocked: false });

      await service.createAnswer('u1', 'q1', 'a solid answer');

      const qUpdate = (prisma.question.update as jest.Mock).mock.calls[0][0];
      expect(qUpdate.data.answerCount).toEqual({ increment: 1 });
      expect(qUpdate.data.lastActivityAt).toBeInstanceOf(Date);
    });
  });

  describe('moderation', () => {
    it('close toggles isClosed', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', isClosed: false, isLocked: false, isPinned: false });
      (prisma.question.update as jest.Mock).mockResolvedValue({});

      await service.moderate('mod1', 'q1', 'close');
      const call = (prisma.question.update as jest.Mock).mock.calls[0][0];
      expect(call.data.isClosed).toBe(true);
    });

    it('restore clears all moderation flags', async () => {
      (prisma.question.findUnique as jest.Mock).mockResolvedValue({ id: 'q1', isClosed: true, isLocked: true, isPinned: true });

      await service.moderate('mod1', 'q1', 'restore');
      const call = (prisma.question.update as jest.Mock).mock.calls[0][0];
      expect(call.data).toMatchObject({ isClosed: false, isLocked: false, isPinned: false });
    });
  });

  it('unknown question is a 404', async () => {
    (prisma.question.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.getQuestionBySlug('nope')).rejects.toThrow(NotFoundException);
  });
});
