import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';
import { prisma } from '@repo/database';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    
    if (!action) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    
    return next.handle().pipe(
      tap(async () => {
        if (user && user.id) {
          try {
            await prisma.adminActionLog.create({
              data: {
                adminId: user.id,
                action: action,
                targetId: req.params.id || req.body.id || null,
                details: req.body ? req.body : null,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
              }
            });
          } catch (e) {
            console.error('Failed to write audit log:', e);
          }
        }
      })
    );
  }
}
