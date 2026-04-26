import { Injectable } from '@nestjs/common';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { GetConsolidatedByAssociationUseCase } from './get-consolidated-by-association.use-case.js';
import {
  buildPeriodMeta,
  type PeriodMeta,
} from '../../../common/utils/period.util.js';
import { DEFAULT_REPORT_DEADLINE_DAY } from '../../../config/constants.js';

export interface AssociationSummary {
  associationId: string;
  associationName: string;
  totalPastors: number;
  totalActivities: number;
  totalHours: number;
  avgCompliance: number;
  /** Periodo concreto evaluado para esta asociación (puede variar entre asociaciones si tienen distinto deadlineDay). */
  period: PeriodMeta;
}

export interface UnionConsolidatedResponseDto {
  /** Periodo representativo a nivel union (corresponde al deadlineDay por defecto del sistema). */
  period: PeriodMeta;
  associationSummaries: AssociationSummary[];
  totalAssociations: number;
  totalPastors: number;
  totalActivities: number;
  totalHours: number;
  avgCompliance: number;
}

@Injectable()
export class GetConsolidatedByUnionUseCase {
  constructor(
    private readonly associationRepo: AssociationRepository,
    private readonly getByAssociation: GetConsolidatedByAssociationUseCase,
  ) {}

  async execute(
    unionId: string,
    periodOffset: number,
  ): Promise<UnionConsolidatedResponseDto> {
    const associations = await this.associationRepo.findByUnion(unionId);

    const summaries: AssociationSummary[] = [];
    let totalPastors = 0;
    let totalActivities = 0;
    let totalHours = 0;
    let complianceSum = 0;
    let complianceCount = 0;

    for (const assoc of associations) {
      const consolidated = await this.getByAssociation.execute(
        assoc.id,
        periodOffset,
      );

      const pastorCount = consolidated.pastorSummaries.length;
      const avgCompliance =
        pastorCount > 0
          ? consolidated.pastorSummaries.reduce((s, p) => s + p.compliance, 0) /
            pastorCount
          : 0;

      summaries.push({
        associationId: assoc.id,
        associationName: assoc.name,
        totalPastors: pastorCount,
        totalActivities: consolidated.totals.totalActivities,
        totalHours: consolidated.totals.totalHours,
        avgCompliance: Math.round(avgCompliance * 100) / 100,
        period: consolidated.period,
      });

      totalPastors += pastorCount;
      totalActivities += consolidated.totals.totalActivities;
      totalHours += consolidated.totals.totalHours;
      if (pastorCount > 0) {
        complianceSum += avgCompliance * pastorCount;
        complianceCount += pastorCount;
      }
    }

    // Periodo representativo: el de la primera asociación, o el del default
    // del sistema si la union no tiene asociaciones.
    const representativePeriod =
      summaries[0]?.period ??
      buildPeriodMeta(DEFAULT_REPORT_DEADLINE_DAY, periodOffset);

    return {
      period: representativePeriod,
      associationSummaries: summaries,
      totalAssociations: associations.length,
      totalPastors,
      totalActivities,
      totalHours: Math.round(totalHours * 10) / 10,
      avgCompliance:
        complianceCount > 0
          ? Math.round((complianceSum / complianceCount) * 100) / 100
          : 0,
    };
  }
}
