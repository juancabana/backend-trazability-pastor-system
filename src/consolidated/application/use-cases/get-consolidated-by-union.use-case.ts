import { Injectable } from '@nestjs/common';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { GetConsolidatedByAssociationUseCase } from './get-consolidated-by-association.use-case.js';

export interface AssociationSummary {
  associationId: string;
  associationName: string;
  totalPastors: number;
  totalActivities: number;
  totalHours: number;
  avgCompliance: number;
}

export interface UnionConsolidatedResponseDto {
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
    month: number,
    year: number,
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
        month,
        year,
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
      });

      totalPastors += pastorCount;
      totalActivities += consolidated.totals.totalActivities;
      totalHours += consolidated.totals.totalHours;
      if (pastorCount > 0) {
        complianceSum += avgCompliance * pastorCount;
        complianceCount += pastorCount;
      }
    }

    return {
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
