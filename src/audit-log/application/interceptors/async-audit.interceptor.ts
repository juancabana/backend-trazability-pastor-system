import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { AuditLogBuffer } from '../../infrastructure/audit-log.buffer.js';
import type { JwtPayload } from '../../../auth/infrastructure/strategies/jwt.strategy.js';

/** Roles que se auditan — pastores y owner excluidos */
const AUDITED_ROLES: Set<string> = new Set([
  UserRole.ADMIN_READONLY,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
]);

@Injectable()
export class AsyncAuditInterceptor implements NestInterceptor {
  constructor(private readonly buffer: AuditLogBuffer) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          this.capture(req, res.statusCode);
        },
        error: (err: unknown) => {
          const status =
            err instanceof HttpException
              ? err.getStatus()
              : HttpStatus.INTERNAL_SERVER_ERROR;
          this.capture(req, status);
        },
      }),
    );
  }

  private capture(req: Request, statusCode: number): void {
    const user = (req as Request & { user?: JwtPayload }).user;
    if (!user || !AUDITED_ROLES.has(user.role)) return;

    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ??
      req.socket.remoteAddress ??
      'unknown';

    this.buffer.enqueue({
      userId: user.sub,
      userName: user.displayName,
      userRole: user.role,
      httpMethod: req.method,
      endpoint: req.originalUrl,
      ipAddress: ip,
      statusCode,
      eventType: 'http_request',
    });
  }
}
