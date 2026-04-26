import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReportEntity } from './domain/entities/daily-report.entity.js';
import { DailyReportRepository } from './infrastructure/repositories/daily-report.repository.js';
import { CreateOrUpdateReportUseCase } from './application/use-cases/create-or-update-report.use-case.js';
import { GetReportsByPastorUseCase } from './application/use-cases/get-reports-by-pastor.use-case.js';
import { GetReportByPastorAndDateUseCase } from './application/use-cases/get-report-by-pastor-and-date.use-case.js';
import { DeleteReportUseCase } from './application/use-cases/delete-report.use-case.js';
import { DailyReportController } from './presentation/daily-report.controller.js';
import { AssociationModule } from '../association/association.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyReportEntity]),
    AssociationModule,
    AuthModule,
  ],
  controllers: [DailyReportController],
  providers: [
    DailyReportRepository,
    CreateOrUpdateReportUseCase,
    GetReportsByPastorUseCase,
    GetReportByPastorAndDateUseCase,
    DeleteReportUseCase,
  ],
  exports: [DailyReportRepository],
})
export class DailyReportModule {}
