import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @Expose()
  access_token: string;

  @ApiProperty({ example: 'pastor' })
  @Expose()
  role: string;

  @ApiProperty({ example: 'Ptr. Carlos Mendoza' })
  @Expose()
  displayName: string;

  @ApiProperty({ example: 'pastor@demo.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'uuid-del-usuario' })
  @Expose()
  userId: string;

  @ApiPropertyOptional({ example: 'uuid-de-asociacion' })
  @Expose()
  associationId: string | null;

  @ApiPropertyOptional({ example: 'Asociacion del Caribe Colombiano' })
  @Expose()
  associationName?: string;

  @ApiPropertyOptional({ example: 'uuid-de-union' })
  @Expose()
  unionId: string | null;

  @ApiPropertyOptional({ example: 'Union Colombiana del Norte' })
  @Expose()
  unionName?: string;

  @ApiPropertyOptional({
    example: 19,
    description: 'Dia limite de reporte de la asociacion',
  })
  @Expose()
  reportDeadlineDay?: number;

  @ApiPropertyOptional({ example: 'Pastor' })
  @Expose()
  position?: string;

  @ApiProperty({
    example: false,
    description:
      'Indica si el usuario debe cambiar su contraseña al iniciar sesión',
  })
  @Expose()
  mustChangePassword: boolean;

  @ApiPropertyOptional({
    example: false,
    description:
      'Permite al pastor editar informes de cualquier periodo vencido',
  })
  @Expose()
  canEditAllReports?: boolean;
}
