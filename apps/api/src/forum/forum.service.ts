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

  async getPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return prisma.forumPost.findMany({
      skip,
      take: limit,
      include: {
        author: {
          select: {
            profile: {
              select: { username: true, avatarUrl: true },
            },
            role: true,
            perks: true,
          },
        },
        category: true,
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async createPost(
    userId: string,
    title: string,
    content: string,
    categoryId: string,
  ) {
    if (title.length > 200) {
      throw new BadRequestException('Title is too long (max 200 characters).');
    }
    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const sanitizedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return prisma.forumPost.create({
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
        authorId: userId,
        categoryId,
      },
    });
  }

  async createComment(userId: string, postId: string, content: string) {
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
}
