import { Injectable, NotFoundException } from '@nestjs/common';
import { DailyReportRepository } from '../../../daily-report/infrastructure/repositories/daily-report.repository.js';
import { ActivityCategoryRepository } from '../../../activity-category/infrastructure/repositories/activity-category.repository.js';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import {
  AssociationConsolidatedResponseDto,
  CategoryConsolidated,
  SubCategoryConsolidated,
  PastorSummaryDto,
} from '../dtos/consolidated.response.dto.js';
import { buildPeriodMeta, type PeriodMeta } from '../../../common/utils/period.util.js';
import { countDaysInclusive } from '../helpers/period-helpers.js';
import type { PastorEmailDetail } from '../../../email/excel-generator.service.js';

export interface AssociationEmailData {
  consolidated: AssociationConsolidatedResponseDto;
  pastorDetails: PastorEmailDetail[];
  period: PeriodMeta;
}

@Injectable()
export class GetAssociationForEmailUseCase {
  constructor(
    private readonly reportRepo: DailyReportRepository,
    private readonly categoryRepo: ActivityCategoryRepository,
    private readonly userRepo: UserRepository,
    private readonly districtRepo: DistrictRepository,
    private readonly associationRepo: AssociationRepository,
  ) {}

  async execute(
    associationId: string,
    periodOffset: number,
    includedPastorIds?: string[],
  ): Promise<AssociationEmailData> {
    const association = await this.associationRepo.findById(associationId);
    if (!association) {
      throw new NotFoundException(`Asociación ${associationId} no encontrada`);
    }
    const period = buildPeriodMeta(association.reportDeadlineDay, periodOffset);

    // ── Cargar datos base ──────────────────────────────────────────────────
    const allPastors = (
      await this.userRepo.findByAssociation(associationId)
    ).filter((u) => u.role === UserRole.PASTOR);

    // Filtrar por pastores seleccionados si se especifica
    const pastors =
      includedPastorIds && includedPastorIds.length > 0
        ? allPastors.filter((p) => includedPastorIds.includes(p.id))
        : allPastors;

    const pastorIds = pastors.map((p) => p.id);
    const districts = await this.districtRepo.findByAssociation(associationId);
    const districtMap = new Map(districts.map((d) => [d.id, d.name]));
    const categories = await this.categoryRepo.findAll();

    const reports = await this.reportRepo.findByPastorsAndDateRange(
      pastorIds,
      period.startDate,
      period.endDate,
    );

    // ── Inicializar acumuladores globales ──────────────────────────────────
    const subAccum: Record<
      string,
      Record<string, { name: string; unit: string; qty: number; hrs: number; amt: number }>
    > = {};

    for (const cat of categories) {
      subAccum[cat.id] = {};
      for (const sub of cat.subcategories) {
        subAccum[cat.id][sub.id] = { name: sub.name, unit: sub.unit, qty: 0, hrs: 0, amt: 0 };
      }
    }

    // ── Inicializar acumuladores por pastor ────────────────────────────────
    type PastorSubMap = Record<string, Record<string, { qty: number; hrs: number; amt: number }>>;
    const pastorSubAccum: Record<string, PastorSubMap> = {};
    const pastorStats: Record<
      string,
      { totalReports: number; totalActivities: number; totalHours: number; totalTransportAmount: number; days: Set<string> }
    > = {};

    for (const p of pastors) {
      pastorStats[p.id] = { totalReports: 0, totalActivities: 0, totalHours: 0, totalTransportAmount: 0, days: new Set() };
      pastorSubAccum[p.id] = {};
      for (const cat of categories) {
        pastorSubAccum[p.id][cat.id] = {};
        for (const sub of cat.subcategories) {
          pastorSubAccum[p.id][cat.id][sub.id] = { qty: 0, hrs: 0, amt: 0 };
        }
      }
    }

    // ── Un solo recorrido sobre todos los informes ─────────────────────────
    let totalActivities = 0;
    let totalHours = 0;
    let totalTransportAmount = 0;

    for (const report of reports) {
      const stats = pastorStats[report.pastorId];
      if (!stats) continue;
      stats.totalReports += 1;
      stats.days.add(report.date);

      for (const activity of report.activities) {
        const catSubs = subAccum[activity.categoryId];
        if (!catSubs) continue;
        const sub = catSubs[activity.subcategoryId];
        if (!sub) continue;

        const qty = activity.quantity || 0;
        const hrs = activity.hours || 0;
        const amt = activity.amount || 0;

        // Global
        sub.qty += qty;
        sub.hrs += hrs;
        sub.amt += amt;
        totalActivities += 1;
        totalHours += hrs;
        totalTransportAmount += amt;

        // Por pastor
        stats.totalActivities += 1;
        stats.totalHours += hrs;
        stats.totalTransportAmount += amt;

        const pSub = pastorSubAccum[report.pastorId]?.[activity.categoryId]?.[activity.subcategoryId];
        if (pSub) {
          pSub.qty += qty;
          pSub.hrs += hrs;
          pSub.amt += amt;
        }
      }
    }

    const daysInPeriod = countDaysInclusive(period.startDate, period.endDate);

    // ── Construir categorías consolidadas globales ─────────────────────────
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
      return { categoryId: cat.id, categoryName: cat.name, color: cat.color, bgColor: cat.bgColor, subcategories };
    });

    // ── Construir resúmenes por pastor ─────────────────────────────────────
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
        compliance: daysInPeriod > 0 ? Math.round((stats.days.size / daysInPeriod) * 100) / 100 : 0,
      };
    });

    // ── Construir PastorEmailDetail[] (con categorías por pastor) ──────────
    const pastorDetails: PastorEmailDetail[] = pastors.map((p) => {
      const stats = pastorStats[p.id];
      const pSubs = pastorSubAccum[p.id];

      const pastorCategories: CategoryConsolidated[] = categories.map((cat) => {
        const catPSubs = pSubs[cat.id];
        const subcategories: SubCategoryConsolidated[] = cat.subcategories.map((sub) => {
          const acc = catPSubs[sub.id];
          return {
            subcategoryId: sub.id,
            subcategoryName: sub.name,
            unit: sub.unit,
            totalQuantity: acc.qty,
            totalHours: Math.round(acc.hrs * 10) / 10,
            totalAmount: acc.amt,
          };
        });
        return { categoryId: cat.id, categoryName: cat.name, color: cat.color, bgColor: cat.bgColor, subcategories };
      });

      return {
        pastorId: p.id,
        pastorName: p.name,
        districtName: p.districtId ? (districtMap.get(p.districtId) ?? null) : null,
        position: p.position ?? null,
        totalReports: stats.totalReports,
        totalActivities: stats.totalActivities,
        totalHours: Math.round(stats.totalHours * 10) / 10,
        totalTransportAmount: stats.totalTransportAmount,
        compliance: daysInPeriod > 0 ? Math.round((stats.days.size / daysInPeriod) * 100) / 100 : 0,
        daysWithReports: stats.days.size,
        daysInPeriod,
        categories: pastorCategories,
      };
    });

    const consolidated: AssociationConsolidatedResponseDto = {
      period,
      categories: consolidatedCategories,
      pastorSummaries,
      totals: { totalActivities, totalHours: Math.round(totalHours * 10) / 10 },
      totalTransportAmount,
    };

    return { consolidated, pastorDetails, period };
  }
}
