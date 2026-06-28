import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    example: 'Iglesia Central',
    description: 'Nombre de la iglesia visitada (solo aplica para subcategoria visitacion).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  churchName?: string;

  @ApiPropertyOptional({
    example: 'Maria Perez',
    description: 'Nombre de la persona visitada (solo aplica para subcategoria visitacion).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  visitedName?: string;

  @ApiPropertyOptional({
    example: 'Acompanamiento espiritual tras perdida familiar.',
    description: 'Motivo de la visita (solo aplica para subcategoria visitacion).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  visitReason?: string;
}
