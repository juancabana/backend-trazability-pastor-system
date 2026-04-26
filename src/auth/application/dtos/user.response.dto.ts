import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiPropertyOptional()
  @Expose()
  associationId: string | null;

  @ApiPropertyOptional()
  @Expose()
  districtId: string | null;

  @ApiPropertyOptional()
  @Expose()
  unionId: string | null;

  @ApiPropertyOptional()
  @Expose()
  position: string | null;

  @ApiPropertyOptional()
  @Expose()
  phone: string | null;

  @ApiPropertyOptional({
    example: false,
    description:
      'Permite al pastor editar informes de cualquier periodo vencido',
  })
  @Expose()
  canEditAllReports: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  static fromEntity(u: {
    id: string;
    name: string;
    email: string;
    role: string;
    associationId: string | null;
    districtId: string | null;
    unionId: string | null;
    position: string | null;
    phone: string | null;
    canEditAllReports: boolean;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      associationId: u.associationId,
      districtId: u.districtId,
      unionId: u.unionId,
      position: u.position,
      phone: u.phone,
      canEditAllReports: u.canEditAllReports,
      createdAt: u.createdAt,
    };
  }
}
