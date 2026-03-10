import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UnionResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  country: string;
}
