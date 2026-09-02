import { Controller, Get, Param, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('courses')
  @UseGuards(OptionalJwtAuthGuard)
  async getCourses() {
    return this.academyService.getCourses();
  }

  @Get('courses/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getCourse(@Param('slug') slug: string) {
    return this.academyService.getCourseBySlug(slug);
  }

  @Get('lessons/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async getLesson(@Param('slug') slug: string) {
    return this.academyService.getLessonBySlug(slug);
  }

  @Post('lessons/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeLesson(@Request() req, @Param('id') lessonId: string) {
    return this.academyService.updateLessonProgress(req.user.id, lessonId);
  }

  @Post('quizzes/:id/submit')
  @UseGuards(JwtAuthGuard)
  async submitQuiz(
    @Request() req,
    @Param('id') quizId: string,
    @Body('answers') answers: any[],
  ) {
    return this.academyService.submitQuiz(req.user.id, quizId, answers);
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  async getProgress(@Request() req) {
    return this.academyService.getUserProgress(req.user.id);
  }
}
