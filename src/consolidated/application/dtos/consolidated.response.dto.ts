import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface SubCategoryConsolidated {
  subcategoryId: string;
  subcategoryName: string;
  unit: string;
  totalQuantity: number;
  totalHours: number;
  totalAmount: number;
}

export interface CategoryConsolidated {
  categoryId: string;
  categoryName: string;
  color: string;
  bgColor: string;
  subcategories: SubCategoryConsolidated[];
}

export interface ConsolidatedTotals {
  totalActivities: number;
  totalHours: number;
}

export class ConsolidatedResponseDto {
  @ApiProperty()
  categories: CategoryConsolidated[];

  @ApiProperty()
  totals: ConsolidatedTotals;

  @ApiProperty({ description: 'Compliance as decimal 0-1' })
  compliance: number;

  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  daysInPeriod: number;

  @ApiProperty()
  daysWithReports: number;

  @ApiProperty()
  totalTransportAmount: number;
}

export class PastorSummaryDto {
  @ApiProperty()
  pastorId: string;

  @ApiProperty()
  pastorName: string;

  @ApiPropertyOptional()
  districtName: string | null;

  @ApiPropertyOptional()
  position: string | null;

  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  totalActivities: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  totalTransportAmount: number;

  @ApiProperty({ description: 'Compliance as decimal 0-1' })
  compliance: number;
}

export class AssociationConsolidatedResponseDto {
  @ApiProperty()
  categories: CategoryConsolidated[];

  @ApiProperty({ type: [PastorSummaryDto] })
  pastorSummaries: PastorSummaryDto[];

  @ApiProperty()
  totals: ConsolidatedTotals;

  @ApiProperty()
  totalTransportAmount: number;
}
