import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEnum,
  IsEmail,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Ptr. Carlos Mendoza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'pastor@demo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'pastor', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'uuid-de-asociacion' })
  @IsOptional()
  @IsUUID()
  associationId?: string;

  @ApiPropertyOptional({ example: 'uuid-de-distrito' })
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ example: 'uuid-de-union' })
  @IsOptional()
  @IsUUID()
  unionId?: string;
}
