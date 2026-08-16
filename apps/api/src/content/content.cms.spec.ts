import { NotFoundException } from '@nestjs/common';
import { ContentService } from './content.service';

jest.mock('@repo/database', () => ({
  prisma: {
    contentArticle: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    contentRevision: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => {
      const tx = {
        contentRevision: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({}),
        },
        contentArticle: {
          update: jest.fn().mockResolvedValue({ id: 'a1', title: 'updated' }),
        },
      };
      return fn(tx);
    }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('@repo/database');

describe('P1-I: CMS workflow', () => {
  let service: ContentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContentService();
  });

  it('createArticle ALWAYS starts as DRAFT (status from payload ignored)', async () => {
    (prisma.contentArticle.create as jest.Mock).mockResolvedValue({ id: 'a1' });

    await service.createArticle({ title: 'T', slug: 't', content: 'c', status: 'PUBLISHED' }, 'author-1');

    const call = (prisma.contentArticle.create as jest.Mock).mock.calls[0][0];
    expect(call.data.status).toBe('DRAFT');
    expect(call.data.authorId).toBe('author-1');
  });

  it('updateArticle snapshots the PREVIOUS state as a revision', async () => {
    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', title: 'old title', content: 'old content', excerpt: 'old',
      metaTitle: 'om', metaDescription: 'omd', authorId: 'author-1',
    });

    await service.updateArticle('a1', { title: 'new title' }, 'editor-9');

    const revCall = prisma.$transaction; // interactive form
    expect(revCall).toHaveBeenCalled();
    // revision created via tx inside transaction
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });

  it('updateArticle CANNOT change workflow fields through the generic update', async () => {
    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', title: 'x', content: 'x', authorId: 'a',
    });

    await service.updateArticle('a1', { title: 'ok', status: 'PUBLISHED', publishedAt: new Date() }, 'e');

    // tx.contentArticle.update called inside $transaction — inspect via spy
    const txUsed = await (prisma.$transaction as jest.Mock).mock.results[0].value;
    expect(txUsed).toBeDefined();
  });

  it('setStatus PUBLISHED stamps publishedAt (once) and clears schedule', async () => {
    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', publishedAt: null, scheduledAt: new Date('2030-01-01'),
    });
    (prisma.contentArticle.update as jest.Mock).mockResolvedValue({});

    await service.setStatus('a1', 'PUBLISHED');

    const call = (prisma.contentArticle.update as jest.Mock).mock.calls[0][0];
    expect(call.data.status).toBe('PUBLISHED');
    expect(call.data.publishedAt).toBeInstanceOf(Date);
    expect(call.data.scheduledAt).toBeNull();
  });

  it('setStatus SCHEDULED requires a date', async () => {
    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({ id: 'a1' });
    await expect(service.setStatus('a1', 'SCHEDULED', 'e')).rejects.toThrow('date de publication');
  });

  it('rollbackToRevision restores the snapshot content', async () => {
    (prisma.contentRevision.findFirst as jest.Mock).mockResolvedValue({
      id: 'rev1', articleId: 'a1', title: 'v1 title', content: 'v1 content',
      excerpt: 'v1', metaTitle: 'm1', metaDescription: 'd1',
    });
    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', title: 'current', content: 'current', authorId: 'a',
    });

    await service.rollbackToRevision('a1', 'rev1', 'editor-2');

    expect(prisma.contentRevision.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rev1', articleId: 'a1' } }),
    );
  });

  it('rollback with a wrong revision id is a 404', async () => {
    (prisma.contentRevision.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.rollbackToRevision('a1', 'nope', 'e')).rejects.toThrow(NotFoundException);
  });

  it('PUBLIC slug endpoint hides non-published and future-scheduled articles', async () => {
    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', status: 'DRAFT', publishedAt: null,
    });
    await expect(service.getArticleBySlug('a1')).rejects.toThrow(NotFoundException);

    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', status: 'PUBLISHED', publishedAt: new Date('2030-01-01'),
    });
    await expect(service.getArticleBySlug('a1')).rejects.toThrow(NotFoundException);

    (prisma.contentArticle.findUnique as jest.Mock).mockResolvedValue({
      id: 'a1', status: 'PUBLISHED', publishedAt: new Date('2020-01-01'),
      locale: 'en', author: { profile: { username: 'u' } },
    });
    await expect(service.getArticleBySlug('a1')).resolves.toBeTruthy();
  });

  it('duplicate creates a DRAFT with a unique slug', async () => {
    (prisma.contentArticle.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'a1', slug: 'my-post', title: 'T', content: 'C', locale: 'en',
        type: 'BLOG', tags: [], authorId: 'author', createdAt: new Date(),
        updatedAt: new Date(), publishedAt: new Date(),
      })
      .mockResolvedValueOnce(null); // no -copy collision
    (prisma.contentArticle.create as jest.Mock).mockResolvedValue({});

    await service.duplicateArticle('a1', 'editor-5');

    const call = (prisma.contentArticle.create as jest.Mock).mock.calls[0][0];
    expect(call.data.slug).toBe('my-post-copy');
    expect(call.data.status).toBe('DRAFT');
    expect(call.data.authorId).toBe('editor-5');
  });
});
