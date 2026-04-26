import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import {
  ConsolidatedResponseDto,
  CategoryConsolidated,
  SubCategoryConsolidated,
} from '../dtos/consolidated.response.dto.js';
import { buildPeriodMeta } from '../../../common/utils/period.util.js';
import { formatBogotaDate, nowInBogota } from '../../../common/utils/bogota-time.util.js';
import {
  countDaysElapsedInPeriod,
  countDaysInclusive,
} from '../helpers/period-helpers.js';

@Injectable()
export class GetConsolidatedByPastorUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly categoryRepo: ActivityCategoryRepository,
    private readonly userRepo: UserRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    pastorId: string,
    periodOffset: number,
  ): Promise<ConsolidatedResponseDto> {
    const pastor = await this.userRepo.findById(pastorId);
    if (!pastor) {
      throw new NotFoundException(`Pastor ${pastorId} no encontrado`);
    }
    if (!pastor.associationId) {
      throw new BadRequestException(
        `El pastor ${pastorId} no pertenece a ninguna asociación`,
      );
    }
    const association = await this.associationRepo.findById(
      pastor.associationId,
    );
    if (!association) {
      throw new NotFoundException(
        `Asociación ${pastor.associationId} no encontrada`,
      );
    }

    const period = buildPeriodMeta(association.reportDeadlineDay, periodOffset);

    const reports = await this.reportRepo.findByPastorAndDateRange(
      pastorId,
      period.startDate,
      period.endDate,
    );
    const categories = await this.categoryRepo.findAll();

    const subAccum: Record<
      string,
      Record<
        string,
        { name: string; unit: string; qty: number; hrs: number; amt: number }
      >
    > = {};

    for (const cat of categories) {
      subAccum[cat.id] = {};
      for (const sub of cat.subcategories) {
        subAccum[cat.id][sub.id] = {
          name: sub.name,
          unit: sub.unit,
          qty: 0,
          hrs: 0,
          amt: 0,
        };
      }
    }

    let totalActivities = 0;
    let totalHours = 0;
    let totalTransportAmount = 0;
    const daysWithReports = new Set<string>();

    for (const report of reports) {
      daysWithReports.add(report.date);
      for (const activity of report.activities) {
        const catSubs = subAccum[activity.categoryId];
        if (!catSubs) continue;
        const sub = catSubs[activity.subcategoryId];
        if (!sub) continue;

        sub.qty += activity.quantity || 0;
        sub.hrs += activity.hours || 0;
        sub.amt += activity.amount || 0;

        totalActivities += 1;
        totalHours += activity.hours || 0;
        totalTransportAmount += activity.amount || 0;
      }
    }

    const daysInPeriod = countDaysInclusive(period.startDate, period.endDate);
    const today = formatBogotaDate(nowInBogota());
    const daysElapsedInPeriod = countDaysElapsedInPeriod(
      period.startDate,
      period.endDate,
      today,
    );

    const consolidatedCategories: CategoryConsolidated[] = categories.map(
      (cat) => {
        const subs = subAccum[cat.id];
        const subcategories: SubCategoryConsolidated[] = cat.subcategories.map(
          (sub) => {
            const acc = subs[sub.id];
            return {
              subcategoryId: sub.id,
              subcategoryName: acc.name,
              unit: acc.unit,
              totalQuantity: acc.qty,
              totalHours: Math.round(acc.hrs * 10) / 10,
              totalAmount: acc.amt,
            };
          },
        );

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          color: cat.color,
          bgColor: cat.bgColor,
          subcategories,
        };
      },
    );

    return {
      period,
      categories: consolidatedCategories,
      totals: {
        totalActivities,
        totalHours: Math.round(totalHours * 10) / 10,
      },
      compliance:
        daysElapsedInPeriod > 0
          ? Math.min(
              1,
              Math.round(
                (daysWithReports.size / daysElapsedInPeriod) * 100,
              ) / 100,
            )
          : 0,
      totalReports: reports.length,
      daysInPeriod,
      daysElapsedInPeriod,
      daysWithReports: daysWithReports.size,
      totalTransportAmount,
    };
  }
}
