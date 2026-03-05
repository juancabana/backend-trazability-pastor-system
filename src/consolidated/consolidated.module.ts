import { Module } from '@nestjs/common';
import { GetConsolidatedByPastorUseCase } from './application/use-cases/get-consolidated-by-pastor.use-case.js';
import { GetConsolidatedByAssociationUseCase } from './application/use-cases/get-consolidated-by-association.use-case.js';
import { ConsolidatedController } from './presentation/consolidated.controller.js';
import { DailyReportModule } from '../daily-report/daily-report.module.js';
import { ActivityCategoryModule } from '../activity-category/activity-category.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DistrictModule } from '../district/district.module.js';

@Module({
  imports: [
    DailyReportModule,
    ActivityCategoryModule,
    AuthModule,
    DistrictModule,
  ],
  controllers: [ConsolidatedController],
  providers: [
    GetConsolidatedByPastorUseCase,
    GetConsolidatedByAssociationUseCase,
  ],
})
export class ConsolidatedModule {}
