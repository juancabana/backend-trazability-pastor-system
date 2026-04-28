import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(id: string, callerRole: UserRole): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === UserRole.OWNER && callerRole !== UserRole.OWNER) {
      throw new ForbiddenException('No tienes permiso para eliminar un usuario owner');
    }

    await this.userRepo.delete(id);
  }
}
