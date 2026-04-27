import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SendConsolidatedReportDto {
  @ApiPropertyOptional({
    description:
      'IDs de los usuarios admin/admin_readonly que recibirán el correo',
    type: [String],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  recipientUserIds?: string[];

  @ApiPropertyOptional({
    description:
      'IDs de correos externos guardados (association_extra_recipients) que recibirán el correo',
    type: [String],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  extraRecipientIds?: string[];

  @ApiProperty({ description: 'ID de la asociación' })
  @IsUUID('4')
  associationId: string;

  @ApiPropertyOptional({
    description:
      'IDs de los pastores cuyos Excel individuales se adjuntarán. Si está vacío o ausente se incluyen todos los pastores.',
    type: [String],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  includedPastorIds?: string[];

  @ApiPropertyOptional({
    description:
      'Offset del periodo respecto al actual (0=actual, -1=anterior, ...). Default: 0.',
    minimum: -120,
    maximum: 12,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(-120)
  @Max(12)
  @Type(() => Number)
  periodOffset?: number;
}

export class SendConsolidatedReportResponseDto {
  @ApiProperty({ description: 'Número de correos enviados' })
  sent: number;

  @ApiProperty({ description: 'Emails de los destinatarios', type: [String] })
  recipients: string[];
}
