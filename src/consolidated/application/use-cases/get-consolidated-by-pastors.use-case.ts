import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import {
  AssociationConsolidatedResponseDto,
  CategoryConsolidated,
  SubCategoryConsolidated,
  PastorSummaryDto,
} from '../dtos/consolidated.response.dto.js';
import { buildPeriodMeta } from '../../../common/utils/period.util.js';
import { countDaysInclusive } from '../helpers/period-helpers.js';
import { DEFAULT_REPORT_DEADLINE_DAY } from '../../../config/constants.js';

@Injectable()
export class GetConsolidatedByPastorsUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly categoryRepo: ActivityCategoryRepository,
    private readonly userRepo: UserRepository,
    private readonly districtRepo: DistrictRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    pastorIds: string[],
    periodOffset: number,
  ): Promise<AssociationConsolidatedResponseDto> {
    if (pastorIds.length === 0) {
      const fallback = buildPeriodMeta(
        DEFAULT_REPORT_DEADLINE_DAY,
        periodOffset,
      );
      return {
        period: fallback,
        categories: [],
        pastorSummaries: [],
        totals: { totalActivities: 0, totalHours: 0 },
        totalTransportAmount: 0,
      };
    }

    const pastors = await this.userRepo.findByIds(pastorIds);
    if (pastors.length === 0) {
      throw new NotFoundException(
        'Ningún pastor encontrado con los IDs proporcionados',
      );
    }

    // Resolvemos el deadlineDay desde la asociación del primer pastor.
    // Asumimos que los pastores seleccionados pertenecen a la misma
    // asociación (es la semántica del consolidado personalizado en admin).
    const firstPastor = pastors[0];
    if (!firstPastor.associationId) {
      throw new BadRequestException(
        `El pastor ${firstPastor.id} no pertenece a ninguna asociación`,
      );
    }
    const association = await this.associationRepo.findById(
      firstPastor.associationId,
    );
    if (!association) {
      throw new NotFoundException(
        `Asociación ${firstPastor.associationId} no encontrada`,
      );
    }
    const period = buildPeriodMeta(association.reportDeadlineDay, periodOffset);

    const districtIds = [
      ...new Set(
        pastors.map((p) => p.districtId).filter((id): id is string => !!id),
      ),
    ];
    const districtEntries = await Promise.all(
      districtIds.map((id) => this.districtRepo.findById(id)),
    );
    const districtMap = new Map(
      districtEntries
        .filter((d): d is NonNullable<typeof d> => !!d)
        .map((d) => [d.id, d.name]),
    );

    const reports = await this.reportRepo.findByPastorsAndDateRange(
      pastors.map((p) => p.id),
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

    const pastorStats: Record<
      string,
      {
        totalReports: number;
        totalActivities: number;
        totalHours: number;
        totalTransportAmount: number;
        days: Set<string>;
      }
    > = {};
    for (const p of pastors) {
      pastorStats[p.id] = {
        totalReports: 0,
        totalActivities: 0,
        totalHours: 0,
        totalTransportAmount: 0,
        days: new Set(),
      };
    }

    let totalActivities = 0;
    let totalHours = 0;
    let totalTransportAmount = 0;

    for (const report of reports) {
      const stats = pastorStats[report.pastorId];
      if (stats) {
        stats.totalReports += 1;
        stats.days.add(report.date);
      }

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

        if (stats) {
          stats.totalActivities += 1;
          stats.totalHours += activity.hours || 0;
          stats.totalTransportAmount += activity.amount || 0;
        }
      }
    }

    const daysInPeriod = countDaysInclusive(period.startDate, period.endDate);

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

    const pastorSummaries: PastorSummaryDto[] = pastors.map((p) => {
      const stats = pastorStats[p.id];
      return {
        pastorId: p.id,
        pastorName: p.name,
        districtName: p.districtId ? (districtMap.get(p.districtId) ?? '') : '',
        position: p.position,
        totalReports: stats.totalReports,
        totalActivities: stats.totalActivities,
        totalHours: Math.round(stats.totalHours * 10) / 10,
        totalTransportAmount: stats.totalTransportAmount,
        compliance:
          daysInPeriod > 0
            ? Math.round((stats.days.size / daysInPeriod) * 100) / 100
            : 0,
      };
    });

    return {
      period,
      categories: consolidatedCategories,
      pastorSummaries,
      totals: {
        totalActivities,
        totalHours: Math.round(totalHours * 10) / 10,
      },
      totalTransportAmount,
    };
  }
}
