---
name: nestjs-clean-arch
description: Use this skill whenever the user is building a NestJS REST API, adding a new module or feature to NestJS, implementing clean architecture, use cases, repositories, DTOs, JWT auth, role-based access control, TypeORM entities, guards, interceptors, or global exception filters. Also activate when the user mentions "clean architecture in NestJS", "use case pattern", "repository pattern NestJS", "NestJS module structure", "NestJS JWT roles", "NestJS TypeORM", "NestJS RBAC", or asks how to organize a NestJS feature. Use this skill even if the user simply says "add a new module" or "create an endpoint" in a NestJS project.
version: 1.0.0
---

# NestJS Clean Architecture Skill

Guidance for building production-grade NestJS REST APIs following clean architecture: strict layer separation, one use case per operation, repository pattern, DTO validation, JWT + role hierarchy, async audit logging, and TypeORM with PostgreSQL.

**Detailed reference files:**
- `references/architecture.md` — Full layer structure, module wiring, AppModule setup
- `references/patterns.md` — Guards, decorators, interceptors, error handling, TypeORM patterns
- `references/examples.md` — Complete code examples per layer

Read a reference file when you need to generate or review code in that area.

---

## Core Principle: Layer Separation

Every domain feature lives in its own module with exactly **four layers**:

```
src/{module}/
  domain/          # TypeORM entities, interfaces, value types
  application/     # Use cases (one class per operation), DTOs
  infrastructure/  # Repositories (data access)
  presentation/    # Controllers, request/response types
  {module}.module.ts
```

**Rule:** each layer only imports from inner layers. The controller never talks to the repository directly — it always goes through a use case.

---

## Folder Structure Reference

```
src/
├── {feature-module}/
│   ├── domain/
│   │   └── entities/           # @Entity classes (TypeORM)
│   ├── application/
│   │   ├── dtos/               # Input & response DTOs
│   │   └── use-cases/          # One injectable class per operation
│   ├── infrastructure/
│   │   └── repositories/       # Extend BaseRepository<T>
│   ├── presentation/
│   │   └── controller/         # @Controller, @UseGuards, @Roles
│   └── {module}.module.ts
├── auth/                        # JWT strategy, guards, user entity
├── common/
│   ├── enums/                   # UserRole and other shared enums
│   ├── filters/                 # GlobalExceptionFilter
│   ├── repositories/            # BaseRepository<T>
│   └── utils/                   # Date, period helpers
├── config/
│   ├── constants.ts             # ROLE_HIERARCHY, throttle limits, defaults
│   └── database.config.ts       # TypeORM async factory
├── audit-log/                   # Async audit buffer + interceptor
└── app.module.ts
```

---

## Creating a New Module: Step-by-Step

When adding a new domain module, follow this order:

1. **Entity** (`domain/entities/{name}.entity.ts`)  
   Use `@PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })`.  
   Add `@CreateDateColumn()` and `@UpdateDateColumn()`. Index frequently-queried FK columns.

2. **DTOs** (`application/dtos/`)  
   - Input DTO: `class-validator` decorators + `@ApiProperty`.  
   - Response DTO: `@Expose()` on every field + static `fromEntity()` factory.  
   - Nest nested objects with `@Type(() => NestedDto)` + `@ValidateNested({ each: true })`.

3. **Repository** (`infrastructure/repositories/{name}.repository.ts`)  
   Extend `BaseRepository<Entity>`. Add domain-specific query methods. Use `QueryBuilder` for complex filters.

4. **Use Cases** (`application/use-cases/`)  
   One class per operation. Inject the repository and any cross-module repos. Throw `HttpException` subclasses for business rule violations. Use `DataSource.transaction()` for multi-step writes.

5. **Controller** (`presentation/{name}.controller.ts`)  
   Inject use cases only. Apply `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`. Validate IDs with `ParseUUIDPipe`. Never access the DB from a controller.

6. **Module file** (`{module}.module.ts`)  
   Import `TypeOrmModule.forFeature([Entity])`. List all use cases and the repository in `providers`. Export the repository if other modules need it.

---

## Auth & RBAC Quick Reference

**Roles** (hierarchy by numeric level):
```
pastor (0) < admin_readonly (1) < admin (2) < super_admin (3) < owner (4)
```

**Guard composition** — always both guards together:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
```

**JWT payload** (`JwtPayload`):
```typescript
{ sub, email, role, displayName, associationId, unionId }
```
Access it via `@Request() req: { user: JwtPayload }`.

**Self-access guard** — pastors can only see their own data:
```typescript
if (req.user.role === UserRole.PASTOR && req.user.sub !== targetId) {
  throw new ForbiddenException('Solo puedes consultar tus propios datos');
}
```

---

## DTO Validation Checklist

Every input DTO must:
- `@IsNotEmpty()` on required strings
- `@MaxLength()` on all strings (prevents DB overflow)
- `@IsUUID()` on all UUID references
- `@IsEnum(UserRole)` on role fields
- `whitelist: true` + `forbidNonWhitelisted: true` in `ValidationPipe` (global)
- `@IsOptional()` before every optional field's other decorators

---

## Error Handling Contract

Always use NestJS built-ins — never throw raw `Error`:
```
400 BadRequestException    — invalid input / missing required context
401 UnauthorizedException  — bad credentials / expired token
403 ForbiddenException     — authenticated but not authorized
404 NotFoundException      — resource not found
409 ConflictException      — duplicate (email, unique constraint)
```

The global `GlobalExceptionFilter` formats all errors as:
```json
{ "statusCode": N, "timestamp": "...", "path": "...", "message": "..." }
```

---

## Key Patterns at a Glance

| Pattern | Location | Note |
|---|---|---|
| Base CRUD | `common/repositories/base.repository.ts` | Extend for all repos |
| Global rate limit | `AppModule` → `ThrottlerGuard` as `APP_GUARD` | 30 req/min default |
| Login rate limit | `@Throttle()` on POST /auth/login | 5 req/min |
| Audit logging | `AsyncAuditInterceptor` as `APP_INTERCEPTOR` | Non-blocking, buffered |
| Pessimistic lock | `lock: { mode: 'pessimistic_write' }` | For upsert operations |
| JSONB column | `@Column({ type: 'jsonb', default: [] })` | Flexible activity arrays |
| ESM imports | All local imports end in `.js` | Required for nodenext |

---

## TypeORM: Critical Rules

- `synchronize: true` **only in development** — never in production
- `PrimaryColumn` with `gen_random_uuid()` — not `@PrimaryGeneratedColumn('uuid')`
- Transactions via `DataSource.transaction(async manager => {...})` 
- Queries with parameters always use **named parameters** (`:param`), never string interpolation
- Connection pool: max 5 in production config
- Entity auto-discovery: `entities: [__dirname + '/../**/*.entity{.ts,.js}']`

---

## Import Convention

All local imports use `.js` extension (ESM / `"module": "nodenext"`):
```typescript
import { UserRole } from '../../common/enums/index.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';
```

---

## AppModule Wiring Template

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({ useFactory: (cs) => cs.getOrThrow('database'), inject: [ConfigService], imports: [ConfigModule] }),
    ThrottlerModule.forRoot([{ ttl: THROTTLE_TTL, limit: THROTTLE_LIMIT }]),
    // feature modules...
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AsyncAuditInterceptor },
  ],
})
export class AppModule {}
```

**main.ts global setup:**
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalFilters(new GlobalExceptionFilter());
```

---

## Audit Log Pattern (Async Buffer)

The `AuditLogBuffer` collects entries in memory and flushes them in batches via `setImmediate`, keeping request latency unaffected. Use it whenever an admin-level action needs to be recorded:

```typescript
this.buffer.enqueue({ userId, userName, userRole, action, endpoint, statusCode, ip });
```

The `AsyncAuditInterceptor` handles this automatically for all HTTP requests — only enqueue manually for out-of-band operations (seeds, CLI scripts).
