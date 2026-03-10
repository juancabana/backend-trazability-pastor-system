import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ptr. Carlos Mendoza' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'newpassword' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ example: 'pastor', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'uuid-de-distrito' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ example: 'Pastor' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  position?: string;

  @ApiPropertyOptional({ example: '311 660 0185' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
