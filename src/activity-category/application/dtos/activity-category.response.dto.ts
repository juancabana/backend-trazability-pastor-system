import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SubCategory } from '../../domain/entities/activity-category.entity.js';

export class ActivityCategoryResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  color: string;

  @ApiProperty()
  @Expose()
  bgColor: string;

  @ApiProperty()
  @Expose()
  borderColor: string;

  @ApiProperty()
  @Expose()
  subcategories: SubCategory[];

  @ApiProperty()
  @Expose()
  sortOrder: number;
}
