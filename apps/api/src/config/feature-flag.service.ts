import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@repo/database';
import { Role } from '@prisma/client';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  
  // Very basic in-memory cache for ultra-fast access
  private cache: Map<string, { enabled: boolean; percentage: number | null; targetRoles: Role[]; updatedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache

  constructor() {}

  async isFeatureEnabled(key: string, user?: { id: string; role: Role }): Promise<boolean> {
    const now = Date.now();
    let flag = this.cache.get(key);

    if (!flag || now - flag.updatedAt > this.CACHE_TTL_MS) {
      const dbFlag = await prisma.featureFlag.findUnique({ where: { key } });
      if (dbFlag) {
        flag = {
          enabled: dbFlag.enabled,
          percentage: dbFlag.percentage,
          targetRoles: dbFlag.targetRoles,
          updatedAt: now,
        };
        this.cache.set(key, flag);
      } else {
        // Default safe fallback if flag doesn't exist
        return false;
      }
    }

    if (!flag.enabled) return false;

    // Check targeted roles bypass
    if (user && flag.targetRoles && flag.targetRoles.includes(user.role)) {
      return true;
    }

    // Percentage rollout logic (stable deterministic hashing based on user ID or random)
    if (flag.percentage !== null && flag.percentage < 100) {
      if (!user) return Math.random() * 100 < flag.percentage;
      
      // Deterministic based on user ID string hash
      let hash = 0;
      for (let i = 0; i < user.id.length; i++) {
        hash = (hash << 5) - hash + user.id.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) % 100 < flag.percentage;
    }

    return true;
  }
}
