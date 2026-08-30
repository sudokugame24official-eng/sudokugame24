import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  private cache: Map<string, { value: any; updatedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 120000; // 2 minutes

  constructor() {}

  async getSetting<T>(key: string, defaultValue?: T): Promise<T | null> {
    const now = Date.now();
    let setting = this.cache.get(key);

    if (!setting || now - setting.updatedAt > this.CACHE_TTL_MS) {
      const dbSetting = await prisma.siteSettings.findUnique({
        where: { key },
      });
      if (dbSetting) {
        let parsedValue: any;
        try {
          // Prisma handles Json fields. If it's a stringified JSON, parse it.
          // Otherwise, return directly if it's already an object/array.
          parsedValue =
            typeof dbSetting.value === 'string'
              ? JSON.parse(dbSetting.value)
              : dbSetting.value;
        } catch (e) {
          parsedValue = dbSetting.value;
        }

        setting = {
          value: parsedValue,
          updatedAt: now,
        };
        this.cache.set(key, setting);
      } else {
        return defaultValue !== undefined ? defaultValue : null;
      }
    }

    return setting.value as T;
  }
}
