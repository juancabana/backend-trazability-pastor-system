import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  DEFAULT_REPORT_DEADLINE_DAY,
  MAX_REPORT_DEADLINE_DAY,
  MIN_REPORT_DEADLINE_DAY,
} from '../../../config/constants.js';

export class CreateAssociationDto {
  @ApiProperty({ example: 'Asociacion del Caribe Colombiano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'uuid-de-union' })
  @IsUUID()
  @IsNotEmpty()
  unionId: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: DEFAULT_REPORT_DEADLINE_DAY })
  @IsInt()
  @Min(MIN_REPORT_DEADLINE_DAY)
  @Max(MAX_REPORT_DEADLINE_DAY)
  reportDeadlineDay: number;
}
