import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'pastor@demo.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '********' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'uuid-de-asociacion' })
  @IsUUID()
  @IsNotEmpty()
  associationId: string;
}
