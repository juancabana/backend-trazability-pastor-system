import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnionEntity } from './domain/entities/union.entity.js';
import { UnionRepository } from './infrastructure/repositories/union.repository.js';
import { GetUnionsUseCase } from './application/use-cases/get-unions.use-case.js';
import { CreateUnionUseCase } from './application/use-cases/create-union.use-case.js';
import { UpdateUnionUseCase } from './application/use-cases/update-union.use-case.js';
import { UnionController } from './presentation/union.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UnionEntity])],
  controllers: [UnionController],
  providers: [
    UnionRepository,
    GetUnionsUseCase,
    CreateUnionUseCase,
    UpdateUnionUseCase,
  ],
  exports: [UnionRepository],
})
export class UnionModule {}
