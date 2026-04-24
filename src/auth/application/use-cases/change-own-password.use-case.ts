import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { BCRYPT_ROUNDS } from '../../../config/constants.js';

@Injectable()
export class ChangeOwnPasswordUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(userId: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres',
      );
    }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.userRepo.update(userId, {
      passwordHash,
      mustChangePassword: false,
    });
  }
}
