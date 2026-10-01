import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { VisitDetailDto } from './visit-detail.dto.js';
import { MAX_VISITS_PER_ACTIVITY } from '../../../config/constants.js';

export class ActivityEntryDto {
  @ApiProperty({ example: 'campanas' })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({ example: 'predicacion' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({ example: 'Campana en iglesia central' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];

  @ApiPropertyOptional({
    type: [VisitDetailDto],
    description: `Visitas realizadas (solo aplica para subcategoria visitacion, maximo ${MAX_VISITS_PER_ACTIVITY}).`,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_VISITS_PER_ACTIVITY)
  @ValidateNested({ each: true })
  @Type(() => VisitDetailDto)
  visits?: VisitDetailDto[];

  @ApiPropertyOptional({
    deprecated: true,
    example: 'Iglesia Central',
    description:
      'Nombre de la iglesia visitada (formato legado de una sola visita; usar `visits`).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  churchName?: string;

  @ApiPropertyOptional({
    deprecated: true,
    example: 'Maria Perez',
    description:
      'Nombre de la persona visitada (formato legado de una sola visita; usar `visits`).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  visitedName?: string;

  @ApiPropertyOptional({
    deprecated: true,
    example: '+57 300 123 4567',
    description:
      'Numero de WhatsApp de la persona visitada (formato legado de una sola visita; usar `visits`).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string;

  @ApiPropertyOptional({
    deprecated: true,
    example: 'Acompanamiento espiritual tras perdida familiar.',
    description:
      'Motivo de la visita (formato legado de una sola visita; usar `visits`).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  visitReason?: string;
}
