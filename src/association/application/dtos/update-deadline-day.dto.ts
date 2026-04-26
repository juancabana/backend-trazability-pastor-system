import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  MAX_REPORT_DEADLINE_DAY,
  MIN_REPORT_DEADLINE_DAY,
} from '../../../config/constants.js';

export class UpdateDeadlineDayDto {
  @ApiProperty({
    example: 24,
    description:
      'Día del mes en que cierra el periodo de reporte. Rango: 1 a 28 (limite seguro para febrero).',
  })
  @IsInt()
  @Min(MIN_REPORT_DEADLINE_DAY)
  @Max(MAX_REPORT_DEADLINE_DAY)
  reportDeadlineDay: number;
}
