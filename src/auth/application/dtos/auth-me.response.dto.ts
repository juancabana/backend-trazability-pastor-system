import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Datos del usuario autenticado en frescos desde la base.
 * Igual al AuthTokenResponseDto pero sin access_token: el token sigue
 * vigente, lo unico que cambia es el perfil del usuario.
 */
export class AuthMeResponseDto {
  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  displayName: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiPropertyOptional()
  @Expose()
  associationId: string | null;

  @ApiPropertyOptional()
  @Expose()
  associationName?: string;

  @ApiPropertyOptional()
  @Expose()
  unionId: string | null;

  @ApiPropertyOptional()
  @Expose()
  unionName?: string;

  @ApiPropertyOptional()
  @Expose()
  reportDeadlineDay?: number;

  @ApiPropertyOptional()
  @Expose()
  position?: string;

  @ApiProperty()
  @Expose()
  mustChangePassword: boolean;

  @ApiPropertyOptional()
  @Expose()
  canEditAllReports?: boolean;
}
