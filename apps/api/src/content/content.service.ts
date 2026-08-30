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

    // P1-I: ONLY published articles are public. Scheduling is honored:
    // publishedAt in the future keeps the article invisible until it elapses.
    const visible =
      article &&
      article.status === 'PUBLISHED' &&
      (!article.publishedAt || article.publishedAt <= new Date());
    if (!visible) {
      throw new NotFoundException('Article not found or not published');
    }

    if (article.locale !== locale) {
      // In a real system, you might redirect or fetch the localized version
      // based on a grouping ID, but here we just return the closest.
    }

    return article;
  }

  // --- Admin / staff methods (P1-I real CMS workflow) ---

  async createArticle(data: any, authorId: string) {
    const { status, ...rest } = data;
    return prisma.contentArticle.create({
      data: {
        ...rest,
        authorId,
        status: 'DRAFT', // articles always start as drafts
      },
    });
  }

  /**
   * Update content fields. A revision snapshot of the PREVIOUS state is
   * saved automatically so any change can be rolled back.
   */
  async updateArticle(id: string, data: any, editorId?: string) {
    const current = await prisma.contentArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Article not found');

    // Never change workflow fields through the generic update
    const { status, publishedAt, scheduledAt, ...contentFields } = data;

    return prisma.$transaction(async (tx) => {
      // snapshot the previous state, then apply the update — atomically
      await this.snapshotRevision(current, editorId, tx);
      return tx.contentArticle.update({ where: { id }, data: contentFields });
    });
  }

  private async snapshotRevision(article: any, editorId?: string, tx?: any) {
    const db = tx || prisma;
    const last = await db.contentRevision.findFirst({
      where: { articleId: article.id },
      orderBy: { revisionNumber: 'desc' },
    });
    return db.contentRevision.create({
      data: {
        articleId: article.id,
        editorId: editorId || article.authorId,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        revisionNumber: (last?.revisionNumber ?? 0) + 1,
      },
    });
  }

  /**
   * Workflow transitions. publish sets publishedAt (immediately or scheduled).
   */
  async setStatus(
    id: string,
    status: string,
    editorId?: string,
    scheduledAt?: Date,
  ) {
    const article = await prisma.contentArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    const data: any = { status };
    if (status === 'PUBLISHED') {
      data.publishedAt = article.publishedAt ?? new Date();
      data.scheduledAt = null;
    }
    if (status === 'SCHEDULED') {
      if (!scheduledAt) {
        throw new ForbiddenException('Une date de publication est requise.');
      }
      data.scheduledAt = scheduledAt;
      data.publishedAt = scheduledAt; // becomes visible when the time comes
    }
    if (status === 'DRAFT' || status === 'UNPUBLISHED') {
      // keep publishedAt history, only visibility changes
    }

    return prisma.contentArticle.update({ where: { id }, data });
  }

  async duplicateArticle(id: string, editorId: string) {
    const article = await prisma.contentArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      publishedAt: _p,
      ...rest
    } = article;
    let slug = `${article.slug}-copy`;
    const existing = await prisma.contentArticle.findUnique({
      where: { slug },
    });
    if (existing) slug = `${slug}-${Date.now()}`;

    return prisma.contentArticle.create({
      data: { ...rest, slug, status: 'DRAFT', authorId: editorId },
    });
  }

  async getRevisions(id: string) {
    return prisma.contentRevision.findMany({
      where: { articleId: id },
      orderBy: { revisionNumber: 'desc' },
    });
  }

  async rollbackToRevision(id: string, revisionId: string, editorId: string) {
    const revision = await prisma.contentRevision.findFirst({
      where: { id: revisionId, articleId: id },
    });
    if (!revision) throw new NotFoundException('Revision not found');

    return this.updateArticle(
      id,
      {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
        metaTitle: revision.metaTitle,
        metaDescription: revision.metaDescription,
      },
      editorId,
    );
  }

  /** Staff-only preview of an article regardless of its status. */
  async previewArticle(id: string) {
    const article = await prisma.contentArticle.findUnique({
      where: { id },
      include: {
        author: { select: { profile: { select: { username: true } } } },
      },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  /** Admin listing: all statuses. */
  async listForAdmin() {
    return prisma.contentArticle.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        type: true,
        locale: true,
        updatedAt: true,
        publishedAt: true,
        scheduledAt: true,
      },
    });
  }
}
