import { Injectable } from '@nestjs/common';
import { UnionRepository } from '../../infrastructure/repositories/union.repository.js';
import { CreateUnionDto } from '../dtos/create-union.dto.js';
import { UnionResponseDto } from '../dtos/union.response.dto.js';

@Injectable()
export class CreateUnionUseCase {
  constructor(private readonly unionRepo: UnionRepository) {}

  async execute(dto: CreateUnionDto): Promise<UnionResponseDto> {
    const entity = await this.unionRepo.create(dto);
    return { id: entity.id, name: entity.name, country: entity.country };
  }
}
