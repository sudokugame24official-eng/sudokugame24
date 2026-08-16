import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class ContentService {
  async getArticles(query: any = {}) {
    const { status = 'PUBLISHED', locale = 'en', category } = query;

    return prisma.contentArticle.findMany({
      where: {
        status,
        locale,
        ...(category && { category }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        createdAt: true,
        metaTitle: true,
        metaDescription: true,
        openGraphImage: true,
      },
    });
  }

  async getArticleBySlug(slug: string, locale: string = 'en') {
    const article = await prisma.contentArticle.findUnique({
      where: { slug },
      include: {
        author: {
          select: { profile: { select: { username: true, avatarUrl: true } } },
        },
      },
    });

    if (
      !article ||
      (article.status !== 'PUBLISHED' && article.status !== 'REVIEW')
    ) {
      throw new NotFoundException('Article not found or not published');
    }

    if (article.locale !== locale) {
      // In a real system, you might redirect or fetch the localized version
      // based on a grouping ID, but here we just return the closest.
    }

    return article;
  }

  // Admin methods
  async createArticle(data: any, authorId: string) {
    return prisma.contentArticle.create({
      data: {
        ...data,
        authorId,
      },
    });
  }

  async updateArticle(id: string, data: any) {
    return prisma.contentArticle.update({
      where: { id },
      data,
    });
  }
}
