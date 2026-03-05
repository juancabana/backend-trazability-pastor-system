import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ example: 'uuid-de-asociacion' })
  @Expose()
  associationId: string;
}
