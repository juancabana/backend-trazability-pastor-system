import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChurchEntity } from './domain/entities/church.entity.js';
import { ChurchRepository } from './infrastructure/repositories/church.repository.js';
import { GetChurchesUseCase } from './application/use-cases/get-churches.use-case.js';
import { CreateChurchUseCase } from './application/use-cases/create-church.use-case.js';
import { UpdateChurchUseCase } from './application/use-cases/update-church.use-case.js';
import { DeleteChurchUseCase } from './application/use-cases/delete-church.use-case.js';
import { ChurchController } from './presentation/church.controller.js';
import { DistrictModule } from '../district/district.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChurchEntity]),
    forwardRef(() => DistrictModule),
  ],
  controllers: [ChurchController],
  providers: [
    ChurchRepository,
    GetChurchesUseCase,
    CreateChurchUseCase,
    UpdateChurchUseCase,
    DeleteChurchUseCase,
  ],
  exports: [ChurchRepository],
})
export class ChurchModule {}
