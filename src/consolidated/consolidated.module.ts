import { Module } from '@nestjs/common';
import { GetConsolidatedByPastorUseCase } from './application/use-cases/get-consolidated-by-pastor.use-case.js';
import { GetConsolidatedByAssociationUseCase } from './application/use-cases/get-consolidated-by-association.use-case.js';
import { GetConsolidatedByPastorsUseCase } from './application/use-cases/get-consolidated-by-pastors.use-case.js';
import { GetConsolidatedByUnionUseCase } from './application/use-cases/get-consolidated-by-union.use-case.js';
import { SendConsolidatedReportUseCase } from './application/use-cases/send-consolidated-report.use-case.js';
import { GetAssociationForEmailUseCase } from './application/use-cases/get-association-for-email.use-case.js';
import { ConsolidatedController } from './presentation/consolidated.controller.js';
import { DailyReportModule } from '../daily-report/daily-report.module.js';
import { ActivityCategoryModule } from '../activity-category/activity-category.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DistrictModule } from '../district/district.module.js';
import { AssociationModule } from '../association/association.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [
    DailyReportModule,
    ActivityCategoryModule,
    AuthModule,
    DistrictModule,
    AssociationModule,
    EmailModule,
  ],
  controllers: [ConsolidatedController],
  providers: [
    GetConsolidatedByPastorUseCase,
    GetConsolidatedByAssociationUseCase,
    GetConsolidatedByPastorsUseCase,
    GetConsolidatedByUnionUseCase,
    GetAssociationForEmailUseCase,
    SendConsolidatedReportUseCase,
  ],
})
export class ConsolidatedModule {}
