import { Injectable } from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import {
  AssociationConsolidatedResponseDto,
  CategoryConsolidated,
  PastorSummaryDto,
} from '../dtos/consolidated.response.dto.js';

@Injectable()
export class GetConsolidatedByAssociationUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly categoryRepo: ActivityCategoryRepository,
    private readonly userRepo: UserRepository,
    private readonly districtRepo: DistrictRepository,
  ) {}

  async execute(
    associationId: string,
    month: number,
    year: number,
  ): Promise<AssociationConsolidatedResponseDto> {
    const pastors = (
      await this.userRepo.findByAssociation(associationId)
    ).filter((u) => u.role === UserRole.PASTOR);
    const pastorIds = pastors.map((p) => p.id);
    const districts = await this.districtRepo.findByAssociation(associationId);
    const districtMap = new Map(districts.map((d) => [d.id, d.name]));

    const reports = await this.reportRepo.findByAssociationPastors(
      pastorIds,
      year,
      month,
    );
    const categories = await this.categoryRepo.findAll();

    // Build consolidated category map
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

        if (stats) {
          stats.totalActivities += 1;
          stats.totalHours += activity.hours || 0;
          stats.totalTransportAmount += activity.amount || 0;
        }
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    const pastorSummaries: PastorSummaryDto[] = pastors.map((p) => {
      const stats = pastorStats[p.id];
      return {
        pastorId: p.id,
        pastorName: p.name,
        districtName: p.districtId
          ? districtMap.get(p.districtId) ?? ''
          : '',
        totalReports: stats.totalReports,
        totalActivities: stats.totalActivities,
        totalHours: Math.round(stats.totalHours * 10) / 10,
        totalTransportAmount: stats.totalTransportAmount,
        compliancePercentage:
          daysInMonth > 0
            ? Math.round((stats.days.size / daysInMonth) * 100)
            : 0,
      };
    });

    return {
      categories: Object.values(categoryMap),
      pastorSummaries,
      totalReports: reports.length,
      totalActivities,
      totalHours: Math.round(totalHours * 10) / 10,
      totalTransportAmount,
    };
  }
}
