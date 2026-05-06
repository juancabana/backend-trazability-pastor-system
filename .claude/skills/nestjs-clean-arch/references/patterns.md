# Patterns Reference: Guards, DTOs, TypeORM, Error Handling

## Table of Contents
1. [Auth: JWT Strategy](#jwt)
2. [Guards: JwtAuthGuard + RolesGuard](#guards)
3. [Role Hierarchy](#roles)
4. [DTO Patterns](#dtos)
5. [Base Repository](#base-repo)
6. [TypeORM Patterns](#typeorm)
7. [Error Handling](#errors)
8. [Audit Log: Async Buffer](#audit)
9. [Rate Limiting](#throttle)
10. [Timezone Utilities](#timezone)

---

## 1. Auth: JWT Strategy {#jwt}

```typescript
// src/auth/infrastructure/strategies/jwt.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository.js';

export interface JwtPayload {
  sub: string;           // user ID
  email: string;
  role: string;
  displayName: string;
  associationId: string | null;
  unionId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userRepo: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.userRepo.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return payload;
  }
}
```

**JWT signing** (in login use case):
```typescript
const token = this.jwtService.sign(
  { sub: user.id, email: user.email, role: user.role, displayName: user.name, associationId, unionId },
  { expiresIn: '7d' },
);
```

---

## 2. Guards: JwtAuthGuard + RolesGuard {#guards}

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

```typescript
// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { ROLE_HIERARCHY } from '../../config/constants.js';
import { JwtPayload } from '../infrastructure/strategies/jwt.strategy.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() → route is authenticated-only, no role restriction
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const userLevel = ROLE_HIERARCHY[user.role] ?? -1;

    const hasAccess = required.some(
      (role) => userLevel >= (ROLE_HIERARCHY[role] ?? 0),
    );

    if (!hasAccess) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return true;
  }
}
```

```typescript
// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Controller usage:**
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
create(@Body() dto: CreateResourceDto, @Request() req: { user: JwtPayload }) {
  return this.createUseCase.execute(dto, req.user);
}
```

---

## 3. Role Hierarchy {#roles}

```typescript
// src/common/enums/user-role.enum.ts
export enum UserRole {
  PASTOR         = 'pastor',
  ADMIN_READONLY = 'admin_readonly',
  ADMIN          = 'admin',
  SUPER_ADMIN    = 'super_admin',
  OWNER          = 'owner',
}

// src/config/constants.ts
export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.PASTOR]:         0,
  [UserRole.ADMIN_READONLY]: 1,
  [UserRole.ADMIN]:          2,
  [UserRole.SUPER_ADMIN]:    3,
  [UserRole.OWNER]:          4,
};

// Rate limiting
export const THROTTLE_TTL        = 60_000;   // 1 minute window
export const THROTTLE_LIMIT      = 30;       // 30 req/min global
export const THROTTLE_LOGIN_TTL  = 60_000;
export const THROTTLE_LOGIN_LIMIT = 5;       // 5 login attempts/min

// Business rules
export const DEFAULT_REPORT_DEADLINE_DAY = 20;
export const BCRYPT_ROUNDS = 12;
export const JWT_EXPIRY = '7d';
```

---

## 4. DTO Patterns {#dtos}

### Input DTO
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional,
  IsUUID, MaxLength, MinLength, IsArray, ValidateNested, IsNumber, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'carlos@demo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  associationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  position?: string;
}
```

### Nested DTO with array validation
```typescript
export class ActivityEntryDto {
  @IsString() @IsNotEmpty()
  subcategoryId: string;

  @IsString() @IsNotEmpty()
  categoryId: string;

  @IsNumber() @Min(0)
  quantity: number;

  @IsOptional() @IsNumber() @Min(0)
  hours?: number;
}

export class CreateReportDto {
  @IsDateString() @IsNotEmpty()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityEntryDto)
  activities: ActivityEntryDto[];
}
```

### Response DTO with factory
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserEntity } from '../../domain/entities/user.entity.js';

export class UserResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() email: string;
  @ApiProperty() @Expose() role: string;
  @ApiProperty() @Expose() associationId: string | null;
  @ApiProperty() @Expose() createdAt: Date;

  static fromEntity(u: UserEntity): UserResponseDto {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      associationId: u.associationId ?? null,
      createdAt: u.createdAt,
    };
  }
}
```

---

## 5. Base Repository {#base-repo}

```typescript
// src/common/repositories/base.repository.ts
import { Repository, FindOptionsWhere } from 'typeorm';

export abstract class BaseRepository<T extends { id: string }> {
  protected constructor(protected readonly repo: Repository<T>) {}

  findById(id: string): Promise<T | null> {
    return this.repo.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repo.create(data as Parameters<typeof this.repo.create>[0]);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repo.update(id, data as Parameters<Repository<T>['update']>[1]);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  findAll(): Promise<T[]> {
    return this.repo.find();
  }
}
```

### Extending BaseRepository
```typescript
// src/church/infrastructure/repositories/church.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository.js';
import { ChurchEntity } from '../../domain/entities/church.entity.js';

@Injectable()
export class ChurchRepository extends BaseRepository<ChurchEntity> {
  constructor(
    @InjectRepository(ChurchEntity)
    repo: Repository<ChurchEntity>,
  ) {
    super(repo);
  }

  findByDistrict(districtId: string): Promise<ChurchEntity[]> {
    return this.repo.find({ where: { districtId }, order: { name: 'ASC' } });
  }
}
```

---

## 6. TypeORM Patterns {#typeorm}

### Entity with indexes and unique constraint
```typescript
import {
  Entity, PrimaryColumn, Column, Index, Unique,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('daily_reports')
@Unique(['pastorId', 'date'])
export class DailyReportEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  pastorId: string;

  @Column({ type: 'date' })
  @Index()
  date: string;

  @Column({ type: 'jsonb', default: [] })
  activities: ActivityEntry[];

  @Column({ type: 'text', default: '' })
  observations: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

### QueryBuilder for complex filters
```typescript
findByPastorsAndDateRange(
  pastorIds: string[],
  startDate: string,
  endDate: string,
): Promise<DailyReportEntity[]> {
  if (pastorIds.length === 0) return Promise.resolve([]);

  return this.repo
    .createQueryBuilder('report')
    .where('report.pastorId IN (:...pastorIds)', { pastorIds })
    .andWhere('report.date BETWEEN :startDate AND :endDate', { startDate, endDate })
    .orderBy('report.date', 'ASC')
    .getMany();
}
```

### Transactions with pessimistic lock (upsert pattern)
```typescript
// In a use case constructor, inject DataSource
constructor(private readonly dataSource: DataSource) {}

// In execute():
const result = await this.dataSource.transaction(async (manager) => {
  const repo = manager.getRepository(SomeEntity);
  
  const existing = await repo.findOne({
    where: { userId, date },
    lock: { mode: 'pessimistic_write' },
  });

  if (existing) {
    await repo.update(existing.id, updatedFields);
    return repo.findOne({ where: { id: existing.id } });
  }

  const entity = repo.create({ userId, date, ...fields });
  return repo.save(entity);
});
```

---

## 7. Error Handling {#errors}

### Global exception filter
```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      raw == null
        ? 'Internal server error'
        : typeof raw === 'object'
          ? ((raw as Record<string, unknown>).message ?? raw)
          : raw;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

### Exception selection guide
```typescript
// 400 — bad input or missing business context
throw new BadRequestException('El usuario no tiene una asociacion asignada');

// 401 — authentication failed
throw new UnauthorizedException('Credenciales inválidas');

// 403 — authenticated but not permitted
throw new ForbiddenException('Solo puedes consultar tus propios reportes');

// 404 — entity not found
throw new NotFoundException(`Recurso ${id} no encontrado`);

// 409 — duplicate / constraint violation
throw new ConflictException('Ya existe un usuario con ese email');
```

---

## 8. Audit Log: Async Buffer {#audit}

```typescript
// src/audit-log/infrastructure/audit-log.buffer.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository.js';
import { AuditLogEntity } from '../domain/entities/audit-log.entity.js';

@Injectable()
export class AuditLogBuffer implements OnModuleDestroy {
  private queue: Partial<AuditLogEntity>[] = [];
  private scheduled = false;

  constructor(private readonly repo: AuditLogRepository) {}

  enqueue(entry: Partial<AuditLogEntity>): void {
    this.queue.push(entry);
    if (!this.scheduled) {
      this.scheduled = true;
      setImmediate(() => void this.flush());  // runs after current I/O cycle
    }
  }

  private async flush(): Promise<void> {
    this.scheduled = false;
    if (this.queue.length === 0) return;
    const batch = this.queue;
    this.queue = [];
    try {
      await this.repo.insertBatch(batch);
    } catch (err) {
      console.error('[AuditLog] Batch flush failed:', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.flush();  // drain on graceful shutdown
  }
}
```

```typescript
// src/audit-log/application/interceptors/async-audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogBuffer } from '../../infrastructure/audit-log.buffer.js';
import { JwtPayload } from '../../../auth/infrastructure/strategies/jwt.strategy.js';
import { ROLE_HIERARCHY } from '../../../config/constants.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

const AUDIT_MIN_LEVEL = ROLE_HIERARCHY[UserRole.ADMIN];

@Injectable()
export class AsyncAuditInterceptor implements NestInterceptor {
  constructor(private readonly buffer: AuditLogBuffer) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<{ statusCode: number }>();
          this.capture(req, res.statusCode);
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
          this.capture(req, status);
        },
      }),
    );
  }

  private capture(req: Request & { user?: JwtPayload }, statusCode: number): void {
    const user = req.user;
    if (!user) return;

    const userLevel = ROLE_HIERARCHY[user.role] ?? -1;
    if (userLevel < AUDIT_MIN_LEVEL) return;  // skip pastor-level requests

    const ip =
      (req.headers as Record<string, string>)['x-forwarded-for']?.split(',')[0].trim() ??
      'unknown';

    this.buffer.enqueue({
      userId:    user.sub,
      userName:  user.displayName,
      userRole:  user.role,
      action:    req.method,
      endpoint:  req.url,
      statusCode,
      ip,
    });
  }
}
```

---

## 9. Rate Limiting {#throttle}

**Global (AppModule):**
```typescript
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }])
// + { provide: APP_GUARD, useClass: ThrottlerGuard }
```

**Override per endpoint:**
```typescript
import { Throttle } from '@nestjs/throttler';

@Post('login')
@Throttle({ default: { ttl: 60_000, limit: 5 } })
login(@Body() dto: LoginDto): Promise<AuthTokenResponseDto> {
  return this.loginUseCase.execute(dto);
}
```

---

## 10. Timezone Utilities {#timezone}

When the system uses deadline-based reporting in a specific timezone:

```typescript
// src/common/utils/bogota-time.util.ts
const TZ = 'America/Bogota';  // UTC-5, no DST

export function formatBogotaDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function nowInBogota(): Date {
  const str = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
  return new Date(str);
}

export function parseBogotaDate(dateStr: string): Date {
  // dateStr is YYYY-MM-DD in Bogota time
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
```

**Period calculation** (deadline-based reporting window):
```typescript
export function getCurrentPeriod(deadlineDay: number, ref?: Date): Period {
  const today = ref ?? nowInBogota();
  const day = today.getDate();

  if (day <= deadlineDay) {
    // still in previous month's reporting window
    return {
      start: safeDate(today.getFullYear(), today.getMonth() - 1, deadlineDay + 1),
      end:   safeDate(today.getFullYear(), today.getMonth(),     deadlineDay),
    };
  }
  return {
    start: safeDate(today.getFullYear(), today.getMonth(),     deadlineDay + 1),
    end:   safeDate(today.getFullYear(), today.getMonth() + 1, deadlineDay),
  };
}

export function isDateEditable(date: Date, deadlineDay: number): boolean {
  const now    = nowInBogota();
  const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (target > today) return false;
  const period = getCurrentPeriod(deadlineDay);
  return target >= period.start && target <= period.end;
}
```
