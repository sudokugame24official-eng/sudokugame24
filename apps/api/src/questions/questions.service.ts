import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/database';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || 'question';
  let i = 2;
  while (await prisma.question.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

@Injectable()
export class QuestionsService {
  // --- Public ---

  async listQuestions(params: {
    search?: string;
    tag?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
    unanswered?: boolean;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 20));

    const where: any = {};
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { body: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.tag) where.tags = { has: params.tag };
    if (params.unanswered) where.answerCount = 0;

    const orderBy: any =
      params.sort === 'votes'
        ? [{ isPinned: 'desc' as const }, { score: 'desc' as const }]
        : params.sort === 'activity'
          ? [{ isPinned: 'desc' as const }, { lastActivityAt: 'desc' as const }]
          : [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }];

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, slug: true, title: true, body: true, tags: true,
          views: true, score: true, answerCount: true, hasAccepted: true,
          isClosed: true, isPinned: true, createdAt: true, lastActivityAt: true,
          author: { select: { profile: { select: { username: true, avatarUrl: true } } } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      questions,
      total,
      page,
      pageCount: Math.ceil(total / pageSize) || 1,
    };
  }

  async getQuestionBySlug(slug: string, incrementViews = true) {
    const question = await prisma.question.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, profile: { select: { username: true, avatarUrl: true } } } },
        answers: {
          orderBy: [{ isAccepted: 'desc' }, { score: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: { select: { id: true, profile: { select: { username: true, avatarUrl: true } } } },
          },
        },
        _count: { select: { followers: true } },
      },
    });
    if (!question) throw new NotFoundException('Question introuvable');

    if (incrementViews) {
      await prisma.question
        .update({ where: { id: question.id }, data: { views: { increment: 1 } } })
        .catch(() => undefined);
    }
    return question;
  }

  // --- Authenticated ---

  async createQuestion(userId: string, data: { title: string; body: string; tags: string[] }) {
    if (data.title.length < 10 || data.title.length > 180) {
      throw new BadRequestException('Le titre doit contenir entre 10 et 180 caractères.');
    }
    if (data.body.length < 20 || data.body.length > 20000) {
      throw new BadRequestException('La question doit contenir entre 20 et 20000 caractères.');
    }
    const cleanTags = data.tags.slice(0, 5).map((t) => t.toLowerCase().trim()).filter(Boolean);

    return prisma.question.create({
      data: {
        slug: await uniqueSlug(slugify(data.title)),
        title: data.title,
        body: data.body,
        tags: cleanTags,
        authorId: userId,
      },
    });
  }

  async updateQuestion(userId: string, questionId: string, data: { title?: string; body?: string; tags?: string[] }, isModerator = false) {
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question introuvable');
    if (q.authorId !== userId && !isModerator) throw new ForbiddenException();
    if (q.isLocked && !isModerator) throw new ForbiddenException('Question verrouillée.');

    return prisma.question.update({
      where: { id: questionId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.body && { body: data.body }),
        ...(data.tags && { tags: data.tags.slice(0, 5).map((t) => t.toLowerCase().trim()).filter(Boolean) }),
      },
    });
  }

  async deleteQuestion(userId: string, questionId: string, isModerator = false) {
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question introuvable');
    if (q.authorId !== userId && !isModerator) throw new ForbiddenException();
    await prisma.question.delete({ where: { id: questionId } });
    return { success: true };
  }

  async createAnswer(userId: string, questionId: string, body: string) {
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question introuvable');
    if (q.isClosed || q.isLocked) throw new ForbiddenException('Question fermée ou verrouillée.');
    if (body.length < 5 || body.length > 20000) {
      throw new BadRequestException('La réponse doit contenir entre 5 et 20000 caractères.');
    }

    const [answer] = await prisma.$transaction([
      prisma.answer.create({ data: { questionId, authorId: userId, body } }),
      prisma.question.update({
        where: { id: questionId },
        data: { answerCount: { increment: 1 }, lastActivityAt: new Date() },
      }),
    ]);
    return answer;
  }

  async updateAnswer(userId: string, answerId: string, body: string, isModerator = false) {
    const a = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!a) throw new NotFoundException('Réponse introuvable');
    if (a.authorId !== userId && !isModerator) throw new ForbiddenException();
    return prisma.answer.update({ where: { id: answerId }, data: { body } });
  }

  async deleteAnswer(userId: string, answerId: string, isModerator = false) {
    const a = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!a) throw new NotFoundException('Réponse introuvable');
    if (a.authorId !== userId && !isModerator) throw new ForbiddenException();
    await prisma.$transaction([
      prisma.answer.delete({ where: { id: answerId } }),
      prisma.question.update({
        where: { id: a.questionId },
        data: { answerCount: { decrement: 1 }, ...(a.isAccepted ? { hasAccepted: false } : {}) },
      }),
    ]);
    return { success: true };
  }

  /**
   * Vote (±1). Idempotent per user: same value = no-op, opposite value = flip.
   * Score maintained transactionally with the unique vote row.
   */
  async voteQuestion(userId: string, questionId: string, value: number) {
    if (value !== 1 && value !== -1) throw new BadRequestException('Vote invalide.');

    return prisma.$transaction(async (tx) => {
      const q = await tx.question.findUnique({ where: { id: questionId }, select: { authorId: true, isLocked: true } });
      if (!q) throw new NotFoundException('Question introuvable');
      if (q.authorId === userId) throw new ForbiddenException('On ne vote pas pour sa propre question.');
      if (q.isLocked) throw new ForbiddenException('Question verrouillée.');

      const existing = await tx.questionVote.findUnique({
        where: { questionId_userId: { questionId, userId } },
      });
      if (existing?.value === value) return { score: undefined, changed: false };

      let delta = value;
      if (existing) {
        delta = value - existing.value; // flip: ±2
        await tx.questionVote.delete({ where: { id: existing.id } });
      }
      await tx.questionVote.create({ data: { questionId, userId, value } });
      const updated = await tx.question.update({
        where: { id: questionId },
        data: { score: { increment: delta } },
      });
      return { score: updated.score, changed: true };
    });
  }

  async voteAnswer(userId: string, answerId: string, value: number) {
    if (value !== 1 && value !== -1) throw new BadRequestException('Vote invalide.');

    return prisma.$transaction(async (tx) => {
      const a = await tx.answer.findUnique({ where: { id: answerId }, select: { authorId: true, questionId: true } });
      if (!a) throw new NotFoundException('Réponse introuvable');
      if (a.authorId === userId) throw new ForbiddenException('On ne vote pas pour sa propre réponse.');

      const existing = await tx.answerVote.findUnique({
        where: { answerId_userId: { answerId, userId } },
      });
      if (existing?.value === value) return { score: undefined, changed: false };

      let delta = value;
      if (existing) {
        delta = value - existing.value;
        await tx.answerVote.delete({ where: { id: existing.id } });
      }
      await tx.answerVote.create({ data: { answerId, userId, value } });
      const updated = await tx.answer.update({
        where: { id: answerId },
        data: { score: { increment: delta } },
      });
      return { score: updated.score, changed: true };
    });
  }

  /** Only the question author (or a moderator) can accept an answer. */
  async acceptAnswer(userId: string, questionId: string, answerId: string, isModerator = false) {
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question introuvable');
    if (q.authorId !== userId && !isModerator) {
      throw new ForbiddenException('Seul l’auteur de la question peut accepter une réponse.');
    }
    const a = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!a || a.questionId !== questionId) {
      throw new BadRequestException('Cette réponse n’appartient pas à la question.');
    }

    await prisma.$transaction([
      prisma.answer.updateMany({ where: { questionId, isAccepted: true }, data: { isAccepted: false } }),
      prisma.answer.update({ where: { id: answerId }, data: { isAccepted: true } }),
      prisma.question.update({ where: { id: questionId }, data: { hasAccepted: true } }),
    ]);
    return { success: true };
  }

  async toggleFollow(userId: string, questionId: string) {
    const existing = await prisma.questionFollow.findUnique({
      where: { questionId_userId: { questionId, userId } },
    });
    if (existing) {
      await prisma.questionFollow.delete({ where: { id: existing.id } });
      return { following: false };
    }
    await prisma.questionFollow.create({ data: { questionId, userId } });
    return { following: true };
  }

  async reportQuestion(userId: string, questionId: string, reason: string, description?: string) {
    const q = await prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
    if (!q) throw new NotFoundException('Question introuvable');
    await prisma.report.create({
      data: {
        reporterId: userId,
        reportedId: null,
        targetType: 'QUESTION',
        targetId: questionId,
        reason: reason as any,
        description,
      },
    });
    return { success: true };
  }

  // --- Moderation ---

  async moderate(userId: string, questionId: string, action: 'pin' | 'close' | 'lock' | 'restore') {
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question introuvable');

    const data: any =
      action === 'pin'
        ? { isPinned: !q.isPinned }
        : action === 'close'
          ? { isClosed: !q.isClosed }
          : action === 'lock'
            ? { isLocked: !q.isLocked }
            : { isClosed: false, isLocked: false, isPinned: false };

    return prisma.question.update({
      where: { id: questionId },
      data,
    });
  }
}
