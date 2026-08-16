import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateForumPostDto,
  CreateForumCommentDto,
  UpdateForumPostDto,
} from './dto/forum.dto';

@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('categories')
  async getCategories() {
    return this.forumService.getCategories();
  }

  @Get('posts')
  async getPosts(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    return this.forumService.getPosts(pageNum, limitNum);
  }

  @Get('posts/:id')
  async getPostById(@Param('id') id: string) {
    return this.forumService.getPostById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  async createPost(@Request() req: any, @Body() dto: CreateForumPostDto) {
    return this.forumService.createPost(
      req.user.id,
      dto.title,
      dto.content,
      dto.categoryId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/comments')
  async createComment(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() dto: CreateForumCommentDto,
  ) {
    return this.forumService.createComment(req.user.id, postId, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Put('posts/:id')
  async updatePost(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() dto: UpdateForumPostDto,
  ) {
    return this.forumService.updatePost(
      req.user.id,
      postId,
      dto.title,
      dto.content,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  async deletePost(@Request() req: any, @Param('id') postId: string) {
    return this.forumService.deletePost(req.user.id, postId, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Put('comments/:id')
  async updateComment(
    @Request() req: any,
    @Param('id') commentId: string,
    @Body() dto: CreateForumCommentDto,
  ) {
    return this.forumService.updateComment(
      req.user.id,
      commentId,
      dto.content,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  async deleteComment(@Request() req: any, @Param('id') commentId: string) {
    return this.forumService.deleteComment(
      req.user.id,
      commentId,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/like')
  async toggleLikePost(@Request() req: any, @Param('id') postId: string) {
    return this.forumService.toggleLikePost(req.user.id, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/like')
  async toggleLikeComment(@Request() req: any, @Param('id') commentId: string) {
    return this.forumService.toggleLikeComment(req.user.id, commentId);
  }
}
