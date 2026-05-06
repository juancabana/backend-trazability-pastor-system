# Complete Code Examples by Layer

## Table of Contents
1. [Entity (Domain Layer)](#entity)
2. [Input & Response DTOs](#dtos)
3. [Repository (Infrastructure Layer)](#repository)
4. [Use Case (Application Layer)](#use-case)
5. [Controller (Presentation Layer)](#controller)
6. [Module Wiring](#module)
7. [Full Feature: Auth Login Flow](#auth-login)
8. [Use Case with Transaction](#transaction)
9. [Admin-Level Listing with Pagination](#listing)

---

## 1. Entity (Domain Layer) {#entity}

```typescript
// src/church/domain/entities/church.entity.ts
import {
  Entity, PrimaryColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('churches')
export class ChurchEntity {
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  address: string;

  @Column({ type: 'uuid' })
  @Index()
  districtId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  pastorId: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

---

## 2. Input & Response DTOs {#dtos}

```typescript
// src/church/application/dtos/create-church.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateChurchDto {
  @ApiProperty({ example: 'Iglesia Central Bogotá' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Calle 72 # 12-34' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ example: 'uuid-del-distrito' })
  @IsUUID()
  districtId: string;

  @ApiPropertyOptional({ example: 'uuid-del-pastor' })
  @IsOptional()
  @IsUUID()
  pastorId?: string;
}
```

```typescript
// src/church/application/dtos/church.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ChurchEntity } from '../../domain/entities/church.entity.js';

export class ChurchResponseDto {
  @ApiProperty() @Expose() id: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() address: string;
  @ApiProperty() @Expose() districtId: string;
  @ApiProperty() @Expose() pastorId: string | null;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() updatedAt: Date;

  static fromEntity(c: ChurchEntity): ChurchResponseDto {
    return {
      id: c.id, name: c.name, address: c.address,
      districtId: c.districtId, pastorId: c.pastorId ?? null,
      createdAt: c.createdAt, updatedAt: c.updatedAt,
    };
  }
}
```

---

## 3. Repository (Infrastructure Layer) {#repository}

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
    return this.repo.find({
      where: { districtId },
      order: { name: 'ASC' },
    });
  }

  findByPastor(pastorId: string): Promise<ChurchEntity | null> {
    return this.repo.findOne({ where: { pastorId } });
  }

  async existsByNameAndDistrict(name: string, districtId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { name, districtId } });
    return count > 0;
  }
}
```

---

## 4. Use Case (Application Layer) {#use-case}

```typescript
// src/church/application/use-cases/create-church.use-case.ts
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ChurchRepository } from '../../infrastructure/repositories/church.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import { CreateChurchDto } from '../dtos/create-church.dto.js';
import { ChurchResponseDto } from '../dtos/church.response.dto.js';

@Injectable()
export class CreateChurchUseCase {
  constructor(
    private readonly churchRepo: ChurchRepository,
    private readonly districtRepo: DistrictRepository,
  ) {}

  async execute(dto: CreateChurchDto): Promise<ChurchResponseDto> {
    // 1. Validate referenced entities
    const district = await this.districtRepo.findById(dto.districtId);
    if (!district) {
      throw new BadRequestException(`Distrito ${dto.districtId} no encontrado`);
    }

    // 2. Check uniqueness
    const exists = await this.churchRepo.existsByNameAndDistrict(
      dto.name.trim(),
      dto.districtId,
    );
    if (exists) {
      throw new ConflictException('Ya existe una iglesia con ese nombre en el distrito');
    }

    // 3. Create
    const church = await this.churchRepo.create({
      name: dto.name.trim(),
      address: dto.address?.trim() ?? '',
      districtId: dto.districtId,
      pastorId: dto.pastorId ?? null,
    });

    return ChurchResponseDto.fromEntity(church);
  }
}
```

```typescript
// src/church/application/use-cases/get-churches-by-district.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRepository } from '../../infrastructure/repositories/church.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import { ChurchResponseDto } from '../dtos/church.response.dto.js';

@Injectable()
export class GetChurchesByDistrictUseCase {
  constructor(
    private readonly churchRepo: ChurchRepository,
    private readonly districtRepo: DistrictRepository,
  ) {}

  async execute(districtId: string): Promise<ChurchResponseDto[]> {
    const district = await this.districtRepo.findById(districtId);
    if (!district) {
      throw new NotFoundException(`Distrito ${districtId} no encontrado`);
    }

    const churches = await this.churchRepo.findByDistrict(districtId);
    return churches.map(ChurchResponseDto.fromEntity);
  }
}
```

---

## 5. Controller (Presentation Layer) {#controller}

```typescript
// src/church/presentation/church.controller.ts
import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { JwtPayload } from '../../auth/infrastructure/strategies/jwt.strategy.js';
import { CreateChurchDto } from '../application/dtos/create-church.dto.js';
import { ChurchResponseDto } from '../application/dtos/church.response.dto.js';
import { CreateChurchUseCase } from '../application/use-cases/create-church.use-case.js';
import { GetChurchesByDistrictUseCase } from '../application/use-cases/get-churches-by-district.use-case.js';
import { DeleteChurchUseCase } from '../application/use-cases/delete-church.use-case.js';

@ApiTags('churches')
@Controller('churches')
export class ChurchController {
  constructor(
    private readonly createChurchUseCase: CreateChurchUseCase,
    private readonly getByDistrictUseCase: GetChurchesByDistrictUseCase,
    private readonly deleteChurchUseCase: DeleteChurchUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear iglesia' })
  @ApiResponse({ status: 201, type: ChurchResponseDto })
  create(@Body() dto: CreateChurchDto): Promise<ChurchResponseDto> {
    return this.createChurchUseCase.execute(dto);
  }

  @Get('district/:districtId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar iglesias por distrito' })
  @ApiResponse({ status: 200, type: [ChurchResponseDto] })
  getByDistrict(
    @Param('districtId', new ParseUUIDPipe()) districtId: string,
  ): Promise<ChurchResponseDto[]> {
    return this.getByDistrictUseCase.execute(districtId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar iglesia (super_admin)' })
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.deleteChurchUseCase.execute(id, req.user);
  }
}
```

---

## 6. Module Wiring {#module}

```typescript
// src/church/church.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurchEntity } from './domain/entities/church.entity.js';
import { ChurchRepository } from './infrastructure/repositories/church.repository.js';
import { ChurchController } from './presentation/church.controller.js';
import { CreateChurchUseCase } from './application/use-cases/create-church.use-case.js';
import { GetChurchesByDistrictUseCase } from './application/use-cases/get-churches-by-district.use-case.js';
import { DeleteChurchUseCase } from './application/use-cases/delete-church.use-case.js';
import { DistrictModule } from '../district/district.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChurchEntity]),
    DistrictModule,
    AuthModule,
  ],
  controllers: [ChurchController],
  providers: [
    ChurchRepository,
    CreateChurchUseCase,
    GetChurchesByDistrictUseCase,
    DeleteChurchUseCase,
  ],
  exports: [ChurchRepository],
})
export class ChurchModule {}
```

---

## 7. Auth Login Flow {#auth-login}

```typescript
// src/auth/application/use-cases/login.use-case.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { LoginDto } from '../dtos/login.dto.js';
import { AuthTokenResponseDto } from '../dtos/auth-token.response.dto.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.mustChangePassword) {
      // still allow login, but flag it in the response
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.name,
      associationId: user.associationId ?? null,
      unionId: user.unionId ?? null,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token,
      role: user.role,
      displayName: user.name,
      email: user.email,
      userId: user.id,
      associationId: user.associationId ?? null,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
```

---

## 8. Use Case with Transaction {#transaction}

Pattern for operations that must be atomic (create-or-update with conflict prevention):

```typescript
// src/some-module/application/use-cases/create-or-update.use-case.ts
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SomeEntity } from '../../domain/entities/some.entity.js';
import { CreateOrUpdateDto } from '../dtos/create-or-update.dto.js';
import { SomeResponseDto } from '../dtos/some.response.dto.js';

@Injectable()
export class CreateOrUpdateUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    userId: string,
    dto: CreateOrUpdateDto,
  ): Promise<SomeResponseDto> {
    // Business rule check before entering transaction
    if (!this.isAllowed(dto)) {
      throw new ForbiddenException('Operación no permitida en este momento');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SomeEntity);

      // Pessimistic lock prevents concurrent upsert race conditions
      const existing = await repo.findOne({
        where: { userId, date: dto.date },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing) {
        await repo.update(existing.id, {
          value: dto.value,
          notes: dto.notes ?? '',
        });
        return repo.findOneOrFail({ where: { id: existing.id } });
      }

      const entity = repo.create({
        userId,
        date: dto.date,
        value: dto.value,
        notes: dto.notes ?? '',
      });
      return repo.save(entity);
    });

    return SomeResponseDto.fromEntity(result);
  }

  private isAllowed(dto: CreateOrUpdateDto): boolean {
    // deadline / period check logic here
    return true;
  }
}
```

---

## 9. Admin Listing with Scoped Access {#listing}

A common pattern: admins see their scope, super_admins see everything.

```typescript
// src/user/application/use-cases/list-users.use-case.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';
import { JwtPayload } from '../../../auth/infrastructure/strategies/jwt.strategy.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { ROLE_HIERARCHY } from '../../../config/constants.js';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(requestor: JwtPayload): Promise<UserResponseDto[]> {
    const level = ROLE_HIERARCHY[requestor.role] ?? -1;

    let users;

    if (level >= ROLE_HIERARCHY[UserRole.SUPER_ADMIN]) {
      // super_admin and above see all users
      users = await this.userRepo.findAll();
    } else if (level >= ROLE_HIERARCHY[UserRole.ADMIN]) {
      // admin sees only users in their association
      if (!requestor.associationId) {
        throw new ForbiddenException('Administrador sin asociación asignada');
      }
      users = await this.userRepo.findByAssociation(requestor.associationId);
    } else {
      throw new ForbiddenException('Acceso denegado');
    }

    return users.map(UserResponseDto.fromEntity);
  }
}
```

---

## Quick Checklist: New Feature

When generating a new module, verify these exist:

- [ ] `domain/entities/{name}.entity.ts` — PrimaryColumn uuid, @Index on FK columns, @CreateDateColumn/@UpdateDateColumn
- [ ] `application/dtos/create-{name}.dto.ts` — all inputs validated, @MaxLength on strings
- [ ] `application/dtos/{name}.response.dto.ts` — @Expose on all fields, static fromEntity()
- [ ] `infrastructure/repositories/{name}.repository.ts` — extends BaseRepository, domain query methods
- [ ] `application/use-cases/create-{name}.use-case.ts` — validates refs, checks conflicts, returns DTO
- [ ] `presentation/{name}.controller.ts` — ParseUUIDPipe on id params, @UseGuards on every route
- [ ] `{name}.module.ts` — TypeOrmModule.forFeature, all use cases in providers
- [ ] Entity added to `app.module.ts` imports list
- [ ] All imports end in `.js`
