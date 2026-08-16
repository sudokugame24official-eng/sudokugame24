import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@repo/database';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // PUBLIC ENDPOINT - Used by the Next.js frontend to display the homepage images
  @Get('homepage')
  async getHomepageImages() {
    return this.settingsService.getHomepageImages();
  }

  // PUBLIC ENDPOINT - Used by the Next.js frontend layout to inject marketing pixels
  @Get('marketing')
  async getMarketingSettings() {
    return this.settingsService.getMarketingSettings();
  }

  // PROTECTED ENDPOINTS - Used by the Admin Panel
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('homepage/urls')
  async updateHomepageImageUrls(@Body('images') images: string[]) {
    if (!images || !Array.isArray(images)) {
      throw new BadRequestException('Images must be an array of URLs');
    }
    return this.settingsService.updateHomepageImages(images);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('homepage/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHomepageImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check if it's an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    const path = await this.settingsService.saveUploadedFile(file);
    return { url: path };
  }
}
