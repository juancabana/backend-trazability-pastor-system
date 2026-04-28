import { IsDateString, IsIn, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const VALID_EVENT_TYPES = ['http_request', 'login', 'login_failed'] as const;

export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de usuario' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de evento',
    enum: VALID_EVENT_TYPES,
  })
  @IsOptional()
  @IsIn(VALID_EVENT_TYPES)
  eventType?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'Página (desde 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Registros por página (máx 100)', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: number }) => Math.min(value, 100))
  limit?: number = 50;
}
