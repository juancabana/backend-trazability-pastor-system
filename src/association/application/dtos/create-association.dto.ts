import { IsString, IsNotEmpty, MaxLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssociationDto {
  @ApiProperty({ example: 'Asociacion del Caribe Colombiano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Union Colombiana del Norte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  union: string;

  @ApiProperty({ example: 'Colombia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: 19 })
  @IsInt()
  @Min(1)
  @Max(28)
  reportDeadlineDay: number;
}
