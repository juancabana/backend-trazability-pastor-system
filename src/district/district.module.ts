import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistrictEntity } from './domain/entities/district.entity.js';
import { DistrictRepository } from './infrastructure/repositories/district.repository.js';
import { GetDistrictsUseCase } from './application/use-cases/get-districts.use-case.js';
import { CreateDistrictUseCase } from './application/use-cases/create-district.use-case.js';
import { UpdateDistrictUseCase } from './application/use-cases/update-district.use-case.js';
import { DistrictController } from './presentation/district.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([DistrictEntity])],
  controllers: [DistrictController],
  providers: [
    DistrictRepository,
    GetDistrictsUseCase,
    CreateDistrictUseCase,
    UpdateDistrictUseCase,
  ],
  exports: [DistrictRepository],
})
export class DistrictModule {}
