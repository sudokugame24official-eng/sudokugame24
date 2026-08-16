import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permission.decorator';
import { prisma } from '@repo/database';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false; // Authentication should be handled by JwtAuthGuard
    }

    // SUPER_ADMIN automatically bypasses all permission checks
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Fetch the permissions assigned to the user's role
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: user.role
      },
      select: {
        permission: true
      }
    });

    const userPermissionSet = new Set(rolePermissions.map(rp => rp.permission));

    // Check if user has ALL required permissions
    const hasPermission = requiredPermissions.every(permission => userPermissionSet.has(permission));

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied. Missing required permissions: ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
