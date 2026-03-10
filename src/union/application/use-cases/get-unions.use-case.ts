import { Injectable } from '@nestjs/common';
import { UnionRepository } from '../../infrastructure/repositories/union.repository.js';
import { UnionResponseDto } from '../dtos/union.response.dto.js';

@Injectable()
export class GetUnionsUseCase {
  constructor(private readonly unionRepo: UnionRepository) {}

  async execute(): Promise<UnionResponseDto[]> {
    const unions = await this.unionRepo.findAll();
    return unions.map((u) => ({
      id: u.id,
      name: u.name,
      country: u.country,
    }));
  }
}
