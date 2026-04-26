import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository.js';
import { UserResponseDto } from '../dtos/user.response.dto.js';

@Injectable()
export class GetAdminRecipientsUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(associationId: string): Promise<UserResponseDto[]> {
    const users = await this.userRepo.findAdminRecipients(associationId);
    return users.map(UserResponseDto.fromEntity);
  }
}
