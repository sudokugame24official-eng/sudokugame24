import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  Put,
  Patch,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '@repo/database';
import {
  ContentCreateArticleDto,
  ContentUpdateArticleDto,
} from './dto/article.dto';
import { IsIn, IsOptional, IsDateString, IsString, MaxLength } from 'class-validator';

export class SetStatusDto {
  @IsIn(['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'])
  status!: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('articles')
  async getArticles(@Query() query) {
    return this.contentService.getArticles(query);
  }

  @Get('articles/:slug')
  async getArticleBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale: string,
  ) {
    return this.contentService.getArticleBySlug(slug, locale);
  }

  private assertStaff(req: any) {
    if (
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.SUPER_ADMIN &&
      req.user.role !== Role.CONTENT_MANAGER &&
      req.user.role !== Role.MODERATOR
    ) {
      throw new ForbiddenException('Not authorized for content management');
    }
  }

  // --- Staff endpoints (P1-I CMS workflow) ---

  @UseGuards(JwtAuthGuard)
  @Get('admin/articles')
  async listForAdmin(@Request() req) {
    this.assertStaff(req);
    return this.contentService.listForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles')
  async createArticle(@Request() req, @Body() body: ContentCreateArticleDto) {
    this.assertStaff(req);
    return this.contentService.createArticle(body as any, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('articles/:id')
  async updateArticle(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ContentUpdateArticleDto,
  ) {
    this.assertStaff(req);
    return this.contentService.updateArticle(id, body as any, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('articles/:id/status')
  async setStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: SetStatusDto,
  ) {
    this.assertStaff(req);
    return this.contentService.setStatus(
      id,
      body.status,
      req.user.id,
      body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/duplicate')
  async duplicateArticle(@Request() req, @Param('id') id: string) {
    this.assertStaff(req);
    return this.contentService.duplicateArticle(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('articles/:id/revisions')
  async getRevisions(@Request() req, @Param('id') id: string) {
    this.assertStaff(req);
    return this.contentService.getRevisions(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('articles/:id/revisions/:revisionId/rollback')
  async rollback(
    @Request() req,
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
  ) {
    this.assertStaff(req);
    return this.contentService.rollbackToRevision(id, revisionId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('articles/:id/preview')
  async previewArticle(@Request() req, @Param('id') id: string) {
    this.assertStaff(req);
    return this.contentService.previewArticle(id);
  }
}
