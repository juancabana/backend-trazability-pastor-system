import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DEFAULT_REPORT_DEADLINE_DAY,
  MAX_REPORT_DEADLINE_DAY,
  MIN_REPORT_DEADLINE_DAY,
} from '../../../config/constants.js';

export class UpdateAssociationDto {
  @ApiPropertyOptional({ example: 'Asociacion del Caribe Colombiano' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-de-union' })
  @IsOptional()
  @IsUUID()
  unionId?: string;

  @ApiPropertyOptional({ example: 'Colombia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: DEFAULT_REPORT_DEADLINE_DAY })
  @IsOptional()
  @IsInt()
  @Min(MIN_REPORT_DEADLINE_DAY)
  @Max(MAX_REPORT_DEADLINE_DAY)
  reportDeadlineDay?: number;
}
