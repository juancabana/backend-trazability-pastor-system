import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class AddExtraRecipientDto {
  @ApiProperty({ description: 'Correo del destinatario externo' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Nombre del destinatario externo' })
  @IsString()
  @MaxLength(255)
  name: string;
}

export class ExtraRecipientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  associationId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;
}
