import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Difficulty } from '@repo/database';

@Injectable()
export class KnowledgeService {
  async getTechniques(query: any = {}) {
    const { status = 'PUBLISHED', difficulty } = query;
    return prisma.sudokuTechnique.findMany({
      where: {
        status,
        ...(difficulty && { difficulty: difficulty as Difficulty }),
      },
      orderBy: { difficulty: 'asc' }, // usually we order by difficulty: EASY first
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        metaTitle: true,
        metaDescription: true,
      },
    });
  }

  async getTechniqueBySlug(slug: string) {
    const technique = await prisma.sudokuTechnique.findUnique({
      where: { slug },
    });

    if (!technique || technique.status !== 'PUBLISHED') {
      throw new NotFoundException('Technique not found');
    }

    return technique;
  }

  // Admin Endpoints
  async createTechnique(data: any) {
    return prisma.sudokuTechnique.create({ data });
  }

  async updateTechnique(id: string, data: any) {
    return prisma.sudokuTechnique.update({
      where: { id },
      data,
    });
  }

  async deleteTechnique(id: string) {
    return prisma.sudokuTechnique.delete({ where: { id } });
  }
}
