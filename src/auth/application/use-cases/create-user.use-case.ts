import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepo.findByEmail(
      dto.email.toLowerCase().trim(),
    );
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepo.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      role: dto.role,
      passwordHash,
      associationId: dto.associationId ?? null,
      districtId: dto.districtId ?? null,
      unionId: dto.unionId ?? null,
      position: dto.position ?? null,
      phone: dto.phone ?? null,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      associationId: user.associationId,
      districtId: user.districtId,
      unionId: user.unionId,
      position: user.position,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }
}
