import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VisitDetailDto {
  @ApiPropertyOptional({
    example: '7d3f7c1e-1b2a-4c55-9f0e-2a6b1c9d8e70',
    description:
      'Identificador estable de la visita. Si no se envia, el servidor lo genera.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  @ApiPropertyOptional({ example: 'Iglesia Central' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  churchName?: string;

  @ApiProperty({ example: 'Maria Perez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  visitedName: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsappPhone?: string;

  @ApiProperty({ example: 'Acompanamiento espiritual tras perdida familiar.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  visitReason: string;
}
