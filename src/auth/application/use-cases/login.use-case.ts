import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { LoginDto } from '../dtos/login.dto.js';
import { AuthTokenResponseDto } from '../dtos/auth-token.response.dto.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (user.associationId !== dto.associationId) {
      throw new UnauthorizedException(
        'El usuario no pertenece a esta asociacion',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.name,
      associationId: user.associationId,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      role: user.role,
      displayName: user.name,
      email: user.email,
      userId: user.id,
      associationId: user.associationId,
    };
  }
}
