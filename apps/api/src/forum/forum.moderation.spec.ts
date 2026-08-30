import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ForumService } from './forum.service';

jest.mock('@repo/database', () => ({
  prisma: {
    forumPost: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    forumComment: { update: jest.fn(), delete: jest.fn() },
    forumCategory: { findMany: jest.fn().mockResolvedValue([]) },
    like: { findUnique: jest.fn() },
  },
}));

const { prisma } = require('@repo/database');

describe('P1-L: forum moderation + SEO slugs', () => {
  let service: ForumService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ForumService();
  });

  it('createPost generates a unique SEO slug (collision-suffixed)', async () => {
    (prisma.forumPost.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'existing' }) // first slug taken
      .mockResolvedValue(null); // suffixed one free
    (prisma.forumPost.create as jest.Mock).mockResolvedValue({});

    await service.createPost(
      'u1',
      'X-Wing technique explained!',
      'content here',
      'cat1',
    );

    const call = (prisma.forumPost.create as jest.Mock).mock.calls[0][0];
    expect(call.data.slug).toBe('x-wing-technique-explained-2');
  });

  it('moderate delete is a SOFT delete (restorable)', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isPinned: false,
      isClosed: false,
      isLocked: false,
    });

    await service.moderatePost('p1', 'delete');
    expect(
      (prisma.forumPost.update as jest.Mock).mock.calls[0][0].data,
    ).toEqual({ isDeleted: true });
  });

  it('moderate restore clears every flag', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isPinned: true,
      isClosed: true,
      isLocked: true,
    });

    await service.moderatePost('p1', 'restore');
    expect(
      (prisma.forumPost.update as jest.Mock).mock.calls[0][0].data,
    ).toMatchObject({
      isDeleted: false,
      isPinned: false,
      isClosed: false,
      isLocked: false,
    });
  });

  it('moderate pin/close/lock TOGGLE the current state', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      isPinned: false,
      isClosed: true,
      isLocked: false,
    });

    await service.moderatePost('p1', 'pin');
    expect(
      (prisma.forumPost.update as jest.Mock).mock.calls[0][0].data,
    ).toEqual({ isPinned: true });

    await service.moderatePost('p1', 'close');
    expect(
      (prisma.forumPost.update as jest.Mock).mock.calls[1][0].data,
    ).toEqual({ isClosed: false });
  });

  it('unknown post moderation is a 404', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.moderatePost('nope', 'pin')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('comments on CLOSED or LOCKED topics are rejected', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      isClosed: true,
      isLocked: false,
    });
    await expect(service.createComment('u1', 'p1', 'hi')).rejects.toThrow(
      'fermé',
    );

    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      isClosed: false,
      isLocked: true,
    });
    await expect(service.createComment('u1', 'p1', 'hi')).rejects.toThrow(
      'fermé',
    );
  });

  it('public reads hide soft-deleted posts (by slug AND by id)', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      slug: 'x',
      isDeleted: true,
    });
    await expect(service.getPostBySlug('x', false)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.getPostById('p1')).rejects.toThrow(NotFoundException);
  });

  it('search listing filters soft-deleted and orders pinned first', async () => {
    (prisma.forumPost.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.forumPost.count as jest.Mock).mockResolvedValue(0);

    const res = await service.getPosts({ search: 'x-wing', page: 1 });
    const call = (prisma.forumPost.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.isDeleted).toBe(false);
    expect(call.where.OR).toBeDefined(); // search on title+content
    expect(call.orderBy[0]).toEqual({ isPinned: 'desc' });
    expect(res).toMatchObject({ page: 1, pageCount: 1 });
  });

  it('listing caps the page size', async () => {
    (prisma.forumPost.findMany as jest.Mock).mockResolvedValue([]);
    await service.getPosts({ page: 1, limit: 500 });
    expect(
      (prisma.forumPost.findMany as jest.Mock).mock.calls[0][0].take,
    ).toBeLessThanOrEqual(50);
  });

  it('view increments fire-and-forget never break the read', async () => {
    (prisma.forumPost.findUnique as jest.Mock).mockResolvedValue({
      id: 'p1',
      slug: 'x',
      isDeleted: false,
    });
    (prisma.forumPost.update as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(service.getPostBySlug('x', true)).resolves.toBeTruthy();
  });
});
