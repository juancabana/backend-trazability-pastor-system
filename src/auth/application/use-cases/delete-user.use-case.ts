import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepo.delete(id);
  }
}
