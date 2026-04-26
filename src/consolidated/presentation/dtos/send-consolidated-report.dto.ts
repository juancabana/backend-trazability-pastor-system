import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SendConsolidatedReportDto {
  @ApiProperty({
    description:
      'IDs de los usuarios admin/admin_readonly que recibirán el correo',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  recipientUserIds: string[];

  @ApiProperty({ description: 'ID de la asociación' })
  @IsUUID('4')
  associationId: string;

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

