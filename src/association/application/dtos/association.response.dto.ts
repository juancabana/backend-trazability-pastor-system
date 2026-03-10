import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AssociationResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  unionId: string;

  @ApiProperty()
  @Expose()
  country: string;

  @ApiProperty()
  @Expose()
  reportDeadlineDay: number;
}
