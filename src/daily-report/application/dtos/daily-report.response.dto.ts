import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ActivityEntry,
  DailyReportEntity,
} from '../../domain/entities/daily-report.entity.js';
import { normalizeActivitiesForRead } from '../helpers/visitation-helpers.js';

export class DailyReportResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  pastorId: string;

  @ApiProperty()
  @Expose()
  date: string;

  @ApiProperty()
  @Expose()
  activities: ActivityEntry[];

  @ApiPropertyOptional()
  @Expose()
  observations: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description:
      'Indica si el reporte es editable por el pastor en el periodo actual (calculado server-side en zona Bogota).',
  })
  @Expose()
  isEditable: boolean;

  static fromEntity(
    report: DailyReportEntity,
    isEditable: boolean,
  ): DailyReportResponseDto {
    return {
      id: report.id,
      pastorId: report.pastorId,
      date: report.date,
      activities: normalizeActivitiesForRead(report.activities ?? []),
      observations: report.observations,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      isEditable,
    };
  }
}
