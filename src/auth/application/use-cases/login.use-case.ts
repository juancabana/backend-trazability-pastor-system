import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { UnionRepository } from '../../../union/infrastructure/repositories/union.repository.js';
import { AuditLogBuffer } from '../../../audit-log/infrastructure/audit-log.buffer.js';
import { LoginDto } from '../dtos/login.dto.js';
import { AuthTokenResponseDto } from '../dtos/auth-token.response.dto.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

/** Roles que se auditan en login — pastores y owner excluidos */
const AUDITED_ROLES: Set<string> = new Set([
  UserRole.ADMIN_READONLY,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
]);

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly associationRepo: AssociationRepository,
    private readonly unionRepo: UnionRepository,
    private readonly auditBuffer: AuditLogBuffer,
  ) {}

  async execute(dto: LoginDto, ipAddress = 'unknown'): Promise<AuthTokenResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());

    if (!user) {
      // No tenemos userId — solo registramos el intento si el correo existe
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      if (AUDITED_ROLES.has(user.role)) {
        this.auditBuffer.enqueue({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          httpMethod: 'POST',
          endpoint: '/api/auth/login',
          ipAddress,
          statusCode: 401,
          eventType: 'login_failed',
        });
      }
      throw new UnauthorizedException('Credenciales invalidas');
    }

    // Resolve association and union names in parallel
    const [association, union] = await Promise.all([
      user.associationId
        ? this.associationRepo.findById(user.associationId)
        : null,
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

    if (AUDITED_ROLES.has(user.role)) {
      this.auditBuffer.enqueue({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        httpMethod: 'POST',
        endpoint: '/api/auth/login',
        ipAddress,
        statusCode: 200,
        eventType: 'login',
      });
    }

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
      canEditAllReports: user.canEditAllReports,
    };
  }
}
