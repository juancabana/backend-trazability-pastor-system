import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';

export interface PaginatedUsers {
  data: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetUsersUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(
    associationId?: string,
    page?: number,
    limit?: number,
  ): Promise<UserResponseDto[] | PaginatedUsers> {
    const mapUser = (u: { id: string; name: string; email: string; role: string; associationId: string | null; districtId: string | null; unionId: string | null; createdAt: Date }): UserResponseDto => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      associationId: u.associationId,
      districtId: u.districtId,
      unionId: u.unionId,
      createdAt: u.createdAt,
    });

    if (page && limit) {
      const [users, total] = associationId
        ? await this.userRepo.findByAssociationPaginated(associationId, page, limit)
        : await this.userRepo.findAllPaginated(page, limit);
      return { data: users.map(mapUser), total, page, limit };
    }

    const users = associationId
      ? await this.userRepo.findByAssociation(associationId)
      : await this.userRepo.findAll();
    return users.map(mapUser);
  }
}
