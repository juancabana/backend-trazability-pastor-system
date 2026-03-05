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

export class CreateDailyReportDto {
  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ type: [ActivityEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityEntryDto)
  activities: ActivityEntryDto[];

  @ApiPropertyOptional({ example: 'Preparar materiales para la proxima sesion.' })
  @IsOptional()
  @IsString()
  observations?: string;
}
