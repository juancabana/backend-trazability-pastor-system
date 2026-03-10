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

  @ApiPropertyOptional({ example: 19 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  reportDeadlineDay?: number;
}
