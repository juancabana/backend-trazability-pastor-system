import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updates: Record<string, unknown> = {};
    if (dto.name) updates.name = dto.name.trim();
    if (dto.role) updates.role = dto.role;
    if (dto.districtId !== undefined) updates.districtId = dto.districtId;
    if (dto.password)
      updates.passwordHash = await bcrypt.hash(dto.password, 12);

    const updated = await this.userRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      associationId: updated.associationId,
      districtId: updated.districtId,
      createdAt: updated.createdAt,
    };
  }
}
