import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SendConsolidatedReportDto {
  @ApiProperty({
    description: 'IDs de los usuarios admin/admin_readonly que recibirán el correo',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  recipientUserIds: string[];

  @ApiProperty({ description: 'ID de la asociación' })
  @IsUUID('4')
  associationId: string;

  @ApiProperty({ description: 'Mes del reporte (1-12)', minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @ApiProperty({ description: 'Año del reporte', minimum: 2020 })
  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year: number;
}

export class SendConsolidatedReportResponseDto {
  @ApiProperty({ description: 'Número de correos enviados' })
  sent: number;

  @ApiProperty({ description: 'Emails de los destinatarios', type: [String] })
  recipients: string[];
}
