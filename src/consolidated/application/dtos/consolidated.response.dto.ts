import { ApiProperty } from '@nestjs/swagger';

export interface SubCategoryTotal {
  registros: number;
  cantidad: number;
  horas: number;
  monto: number;
}

export interface CategoryConsolidated {
  categoryId: string;
  categoryName: string;
  subcategories: Record<string, SubCategoryTotal & { name: string }>;
  totalRegistros: number;
  totalCantidad: number;
  totalHoras: number;
  totalMonto: number;
}

export class ConsolidatedResponseDto {
  @ApiProperty()
  categories: CategoryConsolidated[];

  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  totalActivities: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  totalTransportAmount: number;

  @ApiProperty()
  daysInPeriod: number;

  @ApiProperty()
  daysWithReports: number;

  @ApiProperty()
  compliancePercentage: number;
}

export class PastorSummaryDto {
  @ApiProperty()
  pastorId: string;

  @ApiProperty()
  pastorName: string;

  @ApiProperty()
  districtName: string;

  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  totalActivities: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  totalTransportAmount: number;

  @ApiProperty()
  compliancePercentage: number;
}

export class AssociationConsolidatedResponseDto {
  @ApiProperty()
  categories: CategoryConsolidated[];

  @ApiProperty({ type: [PastorSummaryDto] })
  pastorSummaries: PastorSummaryDto[];

  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  totalActivities: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  totalTransportAmount: number;
}
