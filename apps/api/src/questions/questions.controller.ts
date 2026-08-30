import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  IsString,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Role } from '@repo/database';

const MOD_ROLES = [Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR];

export class CreateQuestionDto {
  @IsString() @MinLength(10) @MaxLength(180) title!: string;
  @IsString() @MinLength(20) @MaxLength(20000) body!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class CreateAnswerDto {
  @IsString() @MinLength(5) @MaxLength(20000) body!: string;
}

export class UpdateQuestionDto {
  @IsOptional() @IsString() @MinLength(10) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MinLength(20) @MaxLength(20000) body?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class VoteDto {
  @Type(() => Number) @IsInt() @Min(-1) @Max(1) value!: number;
}

export class AcceptDto {
  @IsString() answerId!: string;
}

export class ReportDto {
  @IsIn([
    'SPAM',
    'HARASSMENT',
    'OFFENSIVE_CONTENT',
    'SCAM',
    'INAPPROPRIATE',
    'OTHER',
  ])
  reason!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

export class ModerateDto {
  @IsIn(['pin', 'close', 'lock', 'restore']) action!: string;
}

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // --- Public (SEO) ---

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('unanswered') unanswered?: string,
  ) {
    return this.questionsService.listQuestions({
      search,
      tag,
      sort,
      page: page ? parseInt(page, 10) : 1,
      unanswered: unanswered === 'true',
    });
  }

  @Get(':slug')
  async getBySlug(
    @Param('slug') slug: string,
    @Query('trackView') trackView?: string,
  ) {
    return this.questionsService.getQuestionBySlug(slug, trackView !== 'false');
  }

  // --- Authenticated ---

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() dto: CreateQuestionDto) {
    return this.questionsService.createQuestion(req.user.id, {
      title: dto.title,
      body: dto.body,
      tags: dto.tags ?? [],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.updateQuestion(
      req.user.id,
      id,
      dto,
      MOD_ROLES.includes(req.user.role),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.questionsService.deleteQuestion(
      req.user.id,
      id,
      MOD_ROLES.includes(req.user.role),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/answers')
  async answer(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.questionsService.createAnswer(req.user.id, id, dto.body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('answers/:answerId')
  async updateAnswer(
    @Request() req,
    @Param('answerId') answerId: string,
    @Body() dto: CreateAnswerDto,
  ) {
    return this.questionsService.updateAnswer(
      req.user.id,
      answerId,
      dto.body,
      MOD_ROLES.includes(req.user.role),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('answers/:answerId')
  async deleteAnswer(@Request() req, @Param('answerId') answerId: string) {
    return this.questionsService.deleteAnswer(
      req.user.id,
      answerId,
      MOD_ROLES.includes(req.user.role),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote')
  async vote(@Request() req, @Param('id') id: string, @Body() dto: VoteDto) {
    return this.questionsService.voteQuestion(req.user.id, id, dto.value);
  }

  @UseGuards(JwtAuthGuard)
  @Post('answers/:answerId/vote')
  async voteAnswer(
    @Request() req,
    @Param('answerId') answerId: string,
    @Body() dto: VoteDto,
  ) {
    return this.questionsService.voteAnswer(req.user.id, answerId, dto.value);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async accept(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AcceptDto,
  ) {
    return this.questionsService.acceptAnswer(
      req.user.id,
      id,
      dto.answerId,
      MOD_ROLES.includes(req.user.role),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Request() req, @Param('id') id: string) {
    return this.questionsService.toggleFollow(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  async report(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReportDto,
  ) {
    return this.questionsService.reportQuestion(
      req.user.id,
      id,
      dto.reason,
      dto.description,
    );
  }

  // --- Moderation ---

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('forum.moderate')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('questions.moderate')
  @Post(':id/moderate')
  async moderate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ModerateDto,
  ) {
    return this.questionsService.moderate(req.user.id, id, dto.action as any);
  }
}
