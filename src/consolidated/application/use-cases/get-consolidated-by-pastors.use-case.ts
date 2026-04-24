import { Injectable } from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import {
  AssociationConsolidatedResponseDto,
  CategoryConsolidated,
  SubCategoryConsolidated,
  PastorSummaryDto,
} from '../dtos/consolidated.response.dto.js';

@Injectable()
export class GetConsolidatedByPastorsUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly categoryRepo: ActivityCategoryRepository,
    private readonly userRepo: UserRepository,
    private readonly districtRepo: DistrictRepository,
  ) {}

  async execute(
    pastorIds: string[],
    month: number,
    year: number,
  ): Promise<AssociationConsolidatedResponseDto> {
    if (pastorIds.length === 0) {
      return {
        categories: [],
        pastorSummaries: [],
        totals: { totalActivities: 0, totalHours: 0 },
        totalTransportAmount: 0,
      };
    }

    const pastors = await this.userRepo.findByIds(pastorIds);

    // Build district name map from the pastors' unique districtIds
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

    const reports = await this.reportRepo.findByAssociationPastors(
      pastors.map((p) => p.id),
      year,
      month,
    );
    const categories = await this.categoryRepo.findAll();

    // Build subcategory accumulators keyed by categoryId -> subcategoryId
    const subAccum: Record<
      string,
      Record<string, { name: string; unit: string; qty: number; hrs: number; amt: number }>
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

    // Build per-pastor stats
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

    const daysInMonth = new Date(year, month, 0).getDate();

    const consolidatedCategories: CategoryConsolidated[] = categories.map((cat) => {
      const subs = subAccum[cat.id];
      const subcategories: SubCategoryConsolidated[] = cat.subcategories.map((sub) => {
        const acc = subs[sub.id];
        return {
          subcategoryId: sub.id,
          subcategoryName: acc.name,
          unit: acc.unit,
          totalQuantity: acc.qty,
          totalHours: Math.round(acc.hrs * 10) / 10,
          totalAmount: acc.amt,
        };
      });

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        color: cat.color,
        bgColor: cat.bgColor,
        subcategories,
      };
    });

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
          daysInMonth > 0
            ? Math.round((stats.days.size / daysInMonth) * 100) / 100
            : 0,
      };
    });

    return {
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
