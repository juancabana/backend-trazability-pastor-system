import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { SubCategoryUnit } from '../../domain/entities/activity-category.entity.js';

const VALID_UNITS: SubCategoryUnit[] = ['cantidad', 'horas', 'veces', 'dias', 'noches'];

export class CreateSubcategoryDto {
  @ApiProperty({ description: 'Nombre de la sección' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unidad de medida',
    enum: VALID_UNITS,
  })
  @IsIn(VALID_UNITS)
  unit: SubCategoryUnit;

  @ApiProperty({ description: 'Si registra horas adicional a la cantidad' })
  @IsBoolean()
  hasHours: boolean;

  @ApiPropertyOptional({ description: 'Descripción opcional de la sección' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class UpdateSubcategoryDto extends PartialType(CreateSubcategoryDto) {}

export class SubcategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: VALID_UNITS })
  unit: SubCategoryUnit;

  @ApiProperty()
  hasHours: boolean;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;
}
