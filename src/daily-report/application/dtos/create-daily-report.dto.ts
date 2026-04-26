import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ActivityEntryDto } from './activity-entry.dto.js';
import { formatBogotaDate } from '../../../common/utils/bogota-time.util.js';

const EXAMPLE_DATE = formatBogotaDate();

export class CreateDailyReportDto {
  @ApiProperty({ example: EXAMPLE_DATE })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ type: [ActivityEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityEntryDto)
  activities: ActivityEntryDto[];

  @ApiPropertyOptional({
    example: 'Preparar materiales para la proxima sesion.',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
