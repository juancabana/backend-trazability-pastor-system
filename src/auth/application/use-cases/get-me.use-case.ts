import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../../../association/infrastructure/repositories/association.repository.js';
import { UnionRepository } from '../../../union/infrastructure/repositories/union.repository.js';
import { AuthMeResponseDto } from '../dtos/auth-me.response.dto.js';

@Injectable()
export class GetMeUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly associationRepo: AssociationRepository,
    private readonly unionRepo: UnionRepository,
  ) {}

  async execute(userId: string): Promise<AuthMeResponseDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const [association, union] = await Promise.all([
      user.associationId
        ? this.associationRepo.findById(user.associationId)
        : null,
      user.unionId ? this.unionRepo.findById(user.unionId) : null,
    ]);

    return {
      role: user.role,
      displayName: user.name,
      email: user.email,
      userId: user.id,
      associationId: user.associationId,
      associationName: association?.name,
      unionId: user.unionId,
      unionName: union?.name,
      reportDeadlineDay: association?.reportDeadlineDay,
      position: user.position ?? undefined,
      mustChangePassword: user.mustChangePassword,
      canEditAllReports: user.canEditAllReports,
    };
  }
}
