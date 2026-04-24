import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { UnionRepository } from '../../../union/infrastructure/repositories/union.repository.js';
import { LoginDto } from '../dtos/login.dto.js';
import { AuthTokenResponseDto } from '../dtos/auth-token.response.dto.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly associationRepo: AssociationRepository,
    private readonly unionRepo: UnionRepository,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokenResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Resolve association and union names in parallel
    const [association, union] = await Promise.all([
      user.associationId ? this.associationRepo.findById(user.associationId) : null,
      user.unionId ? this.unionRepo.findById(user.unionId) : null,
    ]);
    const associationName = association?.name;
    const unionName = union?.name;
    const reportDeadlineDay = association?.reportDeadlineDay;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.name,
      associationId: user.associationId,
      associationName,
      unionId: user.unionId,
      unionName,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      role: user.role,
      displayName: user.name,
      email: user.email,
      userId: user.id,
      associationId: user.associationId,
      associationName,
      unionId: user.unionId,
      unionName,
      reportDeadlineDay,
      position: user.position ?? undefined,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
