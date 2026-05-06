# Architecture Reference: NestJS Clean Architecture

## Table of Contents
1. [Layer Responsibilities](#layers)
2. [Full Module Structure](#module)
3. [AppModule Wiring](#appmodule)
4. [Database Configuration](#database)
5. [main.ts Bootstrap](#main)
6. [Cross-Module Communication](#cross-module)
7. [Seed Scripts](#seeds)

---

## 1. Layer Responsibilities {#layers}

### Domain Layer (`domain/`)
- TypeORM `@Entity` classes — table schema, column types, indexes, unique constraints
- Pure TypeScript interfaces for domain concepts (e.g., `ActivityEntry`, `JwtPayload`)
- No business logic, no NestJS decorators other than TypeORM ones
- Represents the *what exists* in the system

### Application Layer (`application/`)
- **DTOs** (`dtos/`) — input validation with `class-validator`, response serialization
- **Use Cases** (`use-cases/`) — one `@Injectable` class per business operation
- Owns all business decisions: authorization checks, deadline enforcement, conflict detection
- Calls repositories; never touches `EntityManager` directly except inside transactions
- Each use case has a single `execute(...)` method as its public contract

### Infrastructure Layer (`infrastructure/`)
- **Repositories** (`repositories/`) — data access classes, extend `BaseRepository<T>`
- All SQL/TypeORM queries live here — controllers and use cases never write queries
- Methods named after domain intent: `findByPastor`, `findByPastorsAndDateRange`
- Raw `QueryBuilder` permitted here for complex filtering

### Presentation Layer (`presentation/`)
- **Controllers** — map HTTP to use cases, nothing more
- Apply guards, pipes, decorators at the route level
- Read `req.user` (JwtPayload) and pass values into use cases
- Never contain `if/else` business logic — delegate to the use case

---

## 2. Full Module Structure {#module}

```
src/daily-report/
├── domain/
│   └── entities/
│       └── daily-report.entity.ts
├── application/
│   ├── dtos/
│   │   ├── create-daily-report.dto.ts
│   │   ├── activity-entry.dto.ts
│   │   └── daily-report.response.dto.ts
│   └── use-cases/
│       ├── create-or-update-report.use-case.ts
│       ├── get-reports-by-pastor.use-case.ts
│       ├── get-report-by-pastor-and-date.use-case.ts
│       └── delete-report.use-case.ts
├── infrastructure/
│   └── repositories/
│       └── daily-report.repository.ts
├── presentation/
│   └── daily-report.controller.ts
└── daily-report.module.ts
```

### Module File Pattern

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([DailyReportEntity]),
    AssociationModule,   // import to access AssociationRepository
    AuthModule,          // import to access UserRepository + JwtModule
  ],
  controllers: [DailyReportController],
  providers: [
    DailyReportRepository,
    CreateOrUpdateReportUseCase,
    GetReportsByPastorUseCase,
    GetReportByPastorAndDateUseCase,
    DeleteReportUseCase,
  ],
  exports: [DailyReportRepository],  // only export if other modules need it
})
export class DailyReportModule {}
```

**Rules:**
- `TypeOrmModule.forFeature([...])` registers entities for this module's scope
- Only export repositories you know other modules will inject
- Use case classes are never exported — they are internal

---

## 3. AppModule Wiring {#appmodule}

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { databaseConfig } from './config/database.config.js';
import { AsyncAuditInterceptor } from './audit-log/application/interceptors/async-audit.interceptor.js';
import { THROTTLE_TTL, THROTTLE_LIMIT } from './config/constants.js';
// ... import all feature modules

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService): TypeOrmModuleOptions =>
        cs.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    ThrottlerModule.forRoot([
      { ttl: THROTTLE_TTL, limit: THROTTLE_LIMIT },
    ]),
    AuthModule,
    AssociationModule,
    DistrictModule,
    ChurchModule,
    UnionModule,
    ActivityCategoryModule,
    DailyReportModule,
    ConsolidatedModule,
    AuditLogModule,
  ],
  providers: [
    { provide: APP_GUARD,       useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AsyncAuditInterceptor },
  ],
})
export class AppModule {}
```

**Global providers via token:**
- `APP_GUARD` → applies to every route; ThrottlerGuard enforces rate limits globally
- `APP_INTERCEPTOR` → wraps every handler; AsyncAuditInterceptor records all requests non-blocking
- `APP_FILTER` → registered in `main.ts` via `app.useGlobalFilters()` instead

---

## 4. Database Configuration {#database}

```typescript
// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host:     process.env.DB_HOST ?? '',
    port:     parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USERNAME ?? '',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? '',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging:     process.env.NODE_ENV === 'development',
    extra: {
      max: 5,
      min: 1,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
    ssl: { rejectUnauthorized: false },
  }),
);
```

**Required `.env` variables:**
```
JWT_SECRET=
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
NODE_ENV=development
```

---

## 5. main.ts Bootstrap {#main}

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation — whitelist strips unknown fields
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(3000);
}

void bootstrap();
```

---

## 6. Cross-Module Communication {#cross-module}

Modules share repositories (not use cases) by exporting them:

```typescript
// auth.module.ts
@Module({
  providers: [UserRepository, JwtStrategy, RolesGuard],
  exports: [JwtModule, RolesGuard, UserRepository],
})
export class AuthModule {}

// daily-report.module.ts
@Module({
  imports: [AuthModule],   // now UserRepository is injectable here
  providers: [CreateOrUpdateReportUseCase],
})
export class DailyReportModule {}
```

**Never** import a use case from another module — use cases should only be invoked by their own module's controller.

---

## 7. Seed Scripts {#seeds}

Seeds live in `src/database/seeds/` and run via:
```bash
npm run seed
# calls: tsx src/database/seeds/run-seeds.ts
```

Pattern for seed files:
```typescript
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(UserEntity);
  await repo.delete({});   // clear existing
  
  const users = [
    { email: 'admin@demo.com', role: UserRole.ADMIN, ... },
  ];
  await repo.save(users.map(u => repo.create(u)));
}
```

`run-seeds.ts` orchestrates them in dependency order:
unions → associations → districts → churches → activity categories → users
