import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class AcademyService {
  async getCourses() {
    return prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async getCourseBySlug(slug: string) {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async getLessonBySlug(slug: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { slug },
      include: {
        module: {
          include: {
            course: true,
          },
        },
        quizzes: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async updateLessonProgress(userId: string, lessonId: string) {
    return prisma.userLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  async submitQuiz(userId: string, quizId: string, answers: any[]) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questions = quiz.questions as any[];
    let correctAnswers = 0;

    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return prisma.quizResult.create({
      data: {
        userId,
        quizId,
        score,
        passed,
      },
    });
  }

  async getUserProgress(userId: string) {
    const [courses, lessons, quizzes] = await Promise.all([
      prisma.userCourseProgress.findMany({ where: { userId } }),
      prisma.userLessonProgress.findMany({ where: { userId } }),
      prisma.quizResult.findMany({ where: { userId } }),
    ]);

    return { courses, lessons, quizzes };
  }
}
