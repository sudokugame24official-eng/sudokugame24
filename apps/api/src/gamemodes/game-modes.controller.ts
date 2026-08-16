import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { GameModesService } from './game-modes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { AuditAction } from '../auth/decorators/audit-action.decorator';
import { AuditLogInterceptor } from '../auth/interceptors/audit-log.interceptor';

export class UpdateGameModeDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(100) minLevel?: number;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) maxWager?: number;
}

@Controller('config/game-modes')
export class GameModesController {
  constructor(private readonly gameModesService: GameModesService) {}

  /** Public: enabled modes only — disabled modes are invisible. */
  @Get()
  async publicModes() {
    return this.gameModesService.getPublicModes();
  }

  /** Staff: every mode with its full config. */
  @Get('all')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.view')
  async allModes() {
    return this.gameModesService.getAllModes();
  }

  @Put(':mode')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('cms.edit')
  @UseInterceptors(AuditLogInterceptor)
  @AuditAction('gamemodes.update')
  async updateMode(@Param('mode') mode: string, @Body() dto: UpdateGameModeDto) {
    try {
      return await this.gameModesService.updateMode(mode, dto);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }
}
