import { Injectable } from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import {
  ConsolidatedResponseDto,
  CategoryConsolidated,
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

    const categoryMap: Record<string, CategoryConsolidated> = {};
    for (const cat of categories) {
      categoryMap[cat.id] = {
        categoryId: cat.id,
        categoryName: cat.name,
        subcategories: {},
        totalRegistros: 0,
        totalCantidad: 0,
        totalHoras: 0,
        totalMonto: 0,
      };
      for (const sub of cat.subcategories) {
        categoryMap[cat.id].subcategories[sub.id] = {
          name: sub.name,
          registros: 0,
          cantidad: 0,
          horas: 0,
          monto: 0,
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
        const cat = categoryMap[activity.categoryId];
        if (!cat) continue;
        const sub = cat.subcategories[activity.subcategoryId];
        if (!sub) continue;

        sub.registros += 1;
        sub.cantidad += activity.quantity || 0;
        sub.horas += activity.hours || 0;
        sub.monto += activity.amount || 0;

        cat.totalRegistros += 1;
        cat.totalCantidad += activity.quantity || 0;
        cat.totalHoras += activity.hours || 0;
        cat.totalMonto += activity.amount || 0;

        totalActivities += 1;
        totalHours += activity.hours || 0;
        totalTransportAmount += activity.amount || 0;
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    return {
      categories: Object.values(categoryMap),
      totalReports: reports.length,
      totalActivities,
      totalHours: Math.round(totalHours * 10) / 10,
      totalTransportAmount,
      daysInPeriod: daysInMonth,
      daysWithReports: daysWithReports.size,
      compliancePercentage:
        daysInMonth > 0
          ? Math.round((daysWithReports.size / daysInMonth) * 100)
          : 0,
    };
  }
}
