import { Injectable } from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import {
  ConsolidatedResponseDto,
  CategoryConsolidated,
  SubCategoryConsolidated,
} from '../dtos/consolidated.response.dto.js';

@Injectable()
export class GetConsolidatedByPastorUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly categoryRepo: ActivityCategoryRepository,
  ) {}

  async execute(
    pastorId: string,
    month: number,
    year: number,
  ): Promise<ConsolidatedResponseDto> {
    const reports = await this.reportRepo.findByPastorAndMonth(
      pastorId,
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

    const daysInMonth = new Date(year, month, 0).getDate();

    // Build categories array with subcategories as arrays
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

    return {
      categories: consolidatedCategories,
      totals: {
        totalActivities,
        totalHours: Math.round(totalHours * 10) / 10,
      },
      compliance:
        daysInMonth > 0
          ? Math.round((daysWithReports.size / daysInMonth) * 100) / 100
          : 0,
      totalReports: reports.length,
      daysInPeriod: daysInMonth,
      daysWithReports: daysWithReports.size,
      totalTransportAmount,
    };
  }
}
