import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Post,
  Body,
  Put,
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

  // Admin endpoints
  @UseGuards(JwtAuthGuard)
  @Post('articles')
  async createArticle(@Request() req, @Body() body: ContentCreateArticleDto) {
    if (
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.SUPER_ADMIN &&
      req.user.role !== Role.CONTENT_MANAGER &&
      req.user.role !== Role.MODERATOR
    ) {
      throw new ForbiddenException('Not authorized to publish content');
    }
    return this.contentService.createArticle(body as any, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('articles/:id')
  async updateArticle(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ContentUpdateArticleDto,
  ) {
    if (
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.SUPER_ADMIN &&
      req.user.role !== Role.CONTENT_MANAGER &&
      req.user.role !== Role.MODERATOR
    ) {
      throw new ForbiddenException('Not authorized to edit content');
    }
    return this.contentService.updateArticle(id, body as any);
  }
}
