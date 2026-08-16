import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/database';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  async getHomepageImages() {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: 'homepage_carousel' },
    });

    // Default images if nothing is set in DB yet
    if (!settings) {
      return ['/hero1_new.jpg', '/hero2_new.jpg'];
    }

    return settings.value;
  }

  async updateHomepageImages(images: string[]) {
    const updated = await prisma.siteSettings.upsert({
      where: { key: 'homepage_carousel' },
      update: { value: images },
      create: { key: 'homepage_carousel', value: images },
    });
    return updated.value;
  }

  async getMarketingSettings() {
    const keys = [
      'GA_MEASUREMENT_ID',
      'FB_PIXEL_ID',
      'TIKTOK_PIXEL_ID',
      'AD_NETWORK_CLIENT_ID',
    ];
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: keys } },
    });

    const result: any = {
      GA_MEASUREMENT_ID: '',
      FB_PIXEL_ID: '',
      TIKTOK_PIXEL_ID: '',
      AD_NETWORK_CLIENT_ID: '',
    };
    settings.forEach((s) => {
      try {
        result[s.key] = JSON.parse(s.value as string);
      } catch {
        result[s.key] = s.value;
      }
    });
    return result;
  }

  // Handle file upload and return the saved path
  async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    // Save to the Next.js public directory so it can serve the image directly
    const uploadDir = path.join(
      process.cwd(),
      '..',
      'web',
      'public',
      'uploads',
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    // Return the URL path that the frontend can use to fetch the image
    // NestJS needs to be configured to serve static files from 'public'
    return `/uploads/${filename}`;
  }
}
