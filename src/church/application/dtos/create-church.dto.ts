import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChurchDto {
  @ApiProperty({ example: 'Iglesia Central de Barranquilla' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Calle 45 #20-15' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiProperty({ example: 'uuid-de-distrito' })
  @IsUUID()
  @IsNotEmpty()
  districtId: string;
}
