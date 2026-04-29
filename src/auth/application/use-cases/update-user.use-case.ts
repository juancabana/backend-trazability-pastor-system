import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';
import { BCRYPT_ROUNDS } from '../../../config/constants.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    callerRole: UserRole,
  ): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Solo un owner puede modificar a otro owner o asignar el rol owner
    if (user.role === UserRole.OWNER && callerRole !== UserRole.OWNER) {
      throw new ForbiddenException(
        'No tienes permiso para modificar un usuario owner',
      );
    }
    if (dto.role === UserRole.OWNER && callerRole !== UserRole.OWNER) {
      throw new ForbiddenException('Solo el owner puede asignar el rol owner');
    }

    if (dto.email) {
      const existing = await this.userRepo.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'El correo ya está en uso por otro usuario',
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (dto.name) updates.name = dto.name.trim();
    if (dto.email) updates.email = dto.email.toLowerCase().trim();
    if (dto.role) updates.role = dto.role;
    if (dto.districtId !== undefined) updates.districtId = dto.districtId;
    if (dto.position !== undefined) updates.position = dto.position;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.password) {
      updates.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      updates.mustChangePassword = true;
    }
    if (dto.canEditAllReports !== undefined) {
      updates.canEditAllReports = dto.canEditAllReports;
    }

    const updated = await this.userRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return UserResponseDto.fromEntity(updated);
  }
}
