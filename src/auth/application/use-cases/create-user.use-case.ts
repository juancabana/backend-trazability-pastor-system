import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';
import { BCRYPT_ROUNDS } from '../../../config/constants.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(dto: CreateUserDto, callerRole: UserRole): Promise<UserResponseDto> {
    if (dto.role === UserRole.OWNER && callerRole !== UserRole.OWNER) {
      throw new ForbiddenException('Solo el owner puede crear otro usuario owner');
    }

    const existing = await this.userRepo.findByEmail(
      dto.email.toLowerCase().trim(),
    );
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
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

    return UserResponseDto.fromEntity(user);
  }
}
