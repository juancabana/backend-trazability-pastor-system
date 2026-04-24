import { Module } from '@nestjs/common';
import { GetConsolidatedByPastorUseCase } from './application/use-cases/get-consolidated-by-pastor.use-case.js';
import { GetConsolidatedByAssociationUseCase } from './application/use-cases/get-consolidated-by-association.use-case.js';
import { GetConsolidatedByPastorsUseCase } from './application/use-cases/get-consolidated-by-pastors.use-case.js';
import { GetConsolidatedByUnionUseCase } from './application/use-cases/get-consolidated-by-union.use-case.js';
import { ConsolidatedController } from './presentation/consolidated.controller.js';
import { DailyReportModule } from '../daily-report/daily-report.module.js';
import { ActivityCategoryModule } from '../activity-category/activity-category.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DistrictModule } from '../district/district.module.js';
import { AssociationModule } from '../association/association.module.js';

@Module({
  imports: [
    DailyReportModule,
    ActivityCategoryModule,
    AuthModule,
    DistrictModule,
    AssociationModule,
  ],
  controllers: [ConsolidatedController],
  providers: [
    GetConsolidatedByPastorUseCase,
    GetConsolidatedByAssociationUseCase,
    GetConsolidatedByPastorsUseCase,
    GetConsolidatedByUnionUseCase,
  ],
})
export class ConsolidatedModule {}
