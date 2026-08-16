import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { prisma } from '@repo/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';
import { createMediaStorage } from './media-storage';

// Security: strict allow-list of media MIME types and extensions
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(name: string): string {
  // strip paths and dangerous characters, keep a readable slug-ish name
  const base = name.split(/[\\/]/).pop() || 'file';
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

@Controller('media')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MediaController {
  private readonly storage = createMediaStorage();

  /** Upload a media asset (staff, cms.edit permission). */
  @Post('upload')
  @RequirePermission('cms.edit')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  async upload(@UploadedFile() file: any, @Request() req: any) {
    if (!file) throw new BadRequestException('Aucun fichier reçu (champ "file").');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(`Type de fichier non autorisé (${file.mimetype}).`);
    }
    const filename = sanitizeFilename(file.originalname || 'upload');
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      throw new BadRequestException(`Extension non autorisée (${ext}).`);
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 5 Mo).');
    }
    if (file.mimetype === 'image/svg+xml') {
      // SVG can carry scripts — refuse if it contains script tags
      const text = file.buffer.toString('utf8');
      if (/<script|onload\s*=|onerror\s*=/i.test(text)) {
        throw new BadRequestException('SVG contenant du script refusé.');
      }
    }

    const stored = await this.storage.save(file.buffer, filename, file.mimetype);
    return prisma.mediaAsset.create({
      data: {
        key: stored.key,
        url: stored.url,
        filename,
        mimeType: file.mimetype,
        sizeBytes: stored.sizeBytes,
        uploadedBy: req.user.id,
      },
    });
  }

  @Get()
  @RequirePermission('cms.view')
  async list() {
    return prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Patch(':id/alt')
  @RequirePermission('cms.edit')
  async setAlt(@Param('id') id: string, @Body() body: { altText: string }) {
    return prisma.mediaAsset.update({
      where: { id },
      data: { altText: body.altText.slice(0, 300) },
    });
  }

  @Delete(':id')
  @RequirePermission('cms.delete')
  async remove(@Param('id') id: string) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new BadRequestException('Média introuvable.');
    await this.storage.delete(asset.key);
    await prisma.mediaAsset.delete({ where: { id } });
    return { success: true };
  }
}
