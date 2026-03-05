import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';

@Injectable()
export class GetUsersUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(associationId?: string): Promise<UserResponseDto[]> {
    const users = associationId
      ? await this.userRepo.findByAssociation(associationId)
      : await this.userRepo.findAll();

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      associationId: u.associationId,
      districtId: u.districtId,
      createdAt: u.createdAt,
    }));
  }
}
