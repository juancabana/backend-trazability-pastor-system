import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDistrictDto {
  @ApiPropertyOptional({ example: 'Distrito Norte Actualizado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
