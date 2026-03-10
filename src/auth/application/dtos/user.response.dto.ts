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

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
