import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeadlineDayDto {
  @ApiProperty({
    example: 24,
    description:
      'Día del mes en que cierra el periodo de reporte. Rango: 1 al último día del mes calendario (máx. 31).',
  })
  @IsInt()
  @Min(1)
  @Max(31)
  reportDeadlineDay: number;
}
