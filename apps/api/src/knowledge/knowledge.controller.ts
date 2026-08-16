import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';
import { CreateTechniqueDto, UpdateTechniqueDto } from './dto/technique.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('techniques')
  async getTechniques(@Query() query: any) {
    return this.knowledgeService.getTechniques(query);
  }

  @Get('techniques/:slug')
  async getTechniqueBySlug(@Param('slug') slug: string) {
    return this.knowledgeService.getTechniqueBySlug(slug);
  }

  // Admin Routes
  @Post('admin/techniques')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.edit')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('knowledge.create_technique')
  async createTechnique(@Body() data: CreateTechniqueDto) {
    return this.knowledgeService.createTechnique(data as any);
  }

  @Put('admin/techniques/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.edit')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('knowledge.update_technique')
  async updateTechnique(@Param('id') id: string, @Body() data: UpdateTechniqueDto) {
    return this.knowledgeService.updateTechnique(id, data as any);
  }

  @Delete('admin/techniques/:id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.delete')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('knowledge.delete_technique')
  async deleteTechnique(@Param('id') id: string) {
    return this.knowledgeService.deleteTechnique(id);
  }
}
