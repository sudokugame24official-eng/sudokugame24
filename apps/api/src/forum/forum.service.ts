import { trackEvent } from '../analytics/track-event';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class ForumService {
  async getCategories() {
    return prisma.forumCategory.findMany();
  }

  /**
   * P1-L: search + category filter + pin-first ordering + soft-delete
   * exclusion + pagination (capped). Public listing.
   */
  async getPosts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(5, params.limit ?? 15));
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              profile: { select: { username: true, avatarUrl: true } },
              role: true,
              perks: true,
            },
          },
          category: true,
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.forumPost.count({ where }),
    ]);
    return { posts, total, page, pageCount: Math.ceil(total / limit) || 1 };
  }

  async getPostById(id: string) {
    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                level: true,
                rating: true,
              },
            },
            role: true,
            perks: true,
          },
        },
        category: true,
        comments: {
          include: {
            author: {
              select: {
                profile: {
                  select: {
                    username: true,
                    avatarUrl: true,
                    level: true,
                    rating: true,
                  },
                },
                role: true,
                perks: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post || post.isDeleted) throw new NotFoundException('Post not found');
    return post;
  }

  /** P1-L: fetch by SEO slug for the public topic page. */
  async getPostBySlug(slug: string, incrementViews = true) {
    const post = await prisma.forumPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                level: true,
                rating: true,
              },
            },
            role: true,
            perks: true,
          },
        },
        category: true,
        comments: {
          include: {
            author: {
              select: {
                profile: {
                  select: {
                    username: true,
                    avatarUrl: true,
                    level: true,
                    rating: true,
                  },
                },
                role: true,
                perks: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!post || post.isDeleted) throw new NotFoundException('Post not found');
    if (incrementViews) {
      await prisma.forumPost
        .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
        .catch(() => undefined);
    }
    return post;
  }

  async createPost(
    userId: string,
    title: string,
    content: string,
    categoryId: string,
  ) {
    void trackEvent({ name: 'forum_post', userId, metadata: { categoryId } });
    if (title.length > 200) {
      throw new BadRequestException('Title is too long (max 200 characters).');
    }
    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const sanitizedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // P1-L: SEO slug (unique — suffixed on collision)
    const baseSlug =
      sanitizedTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 70) || 'topic';
    let slug = baseSlug;
    let i = 2;
    while (await prisma.forumPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    return prisma.forumPost.create({
      data: {
        slug,
        title: sanitizedTitle,
        content: sanitizedContent,
        authorId: userId,
        categoryId,
      },
    });
  }

  async createComment(userId: string, postId: string, content: string) {
    void trackEvent({ name: 'forum_reply', userId, metadata: { postId } });
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { isClosed: true, isLocked: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.isClosed || post.isLocked) {
      throw new BadRequestException('Ce sujet est fermé ou verrouillé.');
    }
    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return prisma.forumComment.create({
      data: {
        content: sanitizedContent,
        postId,
        authorId: userId,
      },
    });
  }

  async updatePost(
    userId: string,
    postId: string,
    title: string,
    content: string,
    role: string,
  ) {
    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (
      post.authorId !== userId &&
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'MODERATOR'
    ) {
      throw new UnauthorizedException('You can only edit your own posts');
    }
    return prisma.forumPost.update({
      where: { id: postId },
      data: { title, content },
    });
  }

  async deletePost(userId: string, postId: string, role: string) {
    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (
      post.authorId !== userId &&
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'MODERATOR'
    ) {
      throw new UnauthorizedException('You can only delete your own posts');
    }
    return prisma.forumPost.delete({ where: { id: postId } });
  }

  async updateComment(
    userId: string,
    commentId: string,
    content: string,
    role: string,
  ) {
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (
      comment.authorId !== userId &&
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'MODERATOR'
    ) {
      throw new UnauthorizedException('You can only edit your own comments');
    }
    return prisma.forumComment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  async deleteComment(userId: string, commentId: string, role: string) {
    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (
      comment.authorId !== userId &&
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN' &&
      role !== 'MODERATOR'
    ) {
      throw new UnauthorizedException('You can only delete your own comments');
    }
    return prisma.forumComment.delete({ where: { id: commentId } });
  }

  async toggleLikePost(userId: string, postId: string) {
    return prisma.$transaction(async (tx) => {
      const likes = await tx.like.findMany({
        where: { userId, postId, commentId: null },
      });

      if (likes.length > 0) {
        await tx.like.deleteMany({
          where: { userId, postId, commentId: null },
        });
        return { liked: false };
      } else {
        await tx.like.create({
          data: { userId, postId },
        });
        return { liked: true };
      }
    });
  }

  async toggleLikeComment(userId: string, commentId: string) {
    const like = await prisma.like.findFirst({
      where: { userId, commentId, postId: null },
    });

    if (like) {
      await prisma.like.delete({ where: { id: like.id } });
      return { liked: false };
    } else {
      await prisma.like.create({
        data: { userId, commentId },
      });
      return { liked: true };
    }
  }
  // --- P1-L moderation (permission-guarded at the controller) ---

  async moderatePost(
    postId: string,
    action: 'pin' | 'close' | 'lock' | 'delete' | 'restore',
  ) {
    const post = await prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const data: any =
      action === 'pin'
        ? { isPinned: !post.isPinned }
        : action === 'close'
          ? { isClosed: !post.isClosed }
          : action === 'lock'
            ? { isLocked: !post.isLocked }
            : action === 'delete'
              ? { isDeleted: true } // soft delete: restorable
              : {
                  isDeleted: false,
                  isPinned: false,
                  isClosed: false,
                  isLocked: false,
                };

    return prisma.forumPost.update({ where: { id: postId }, data });
  }
}
