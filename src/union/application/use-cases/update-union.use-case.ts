import { Injectable, NotFoundException } from '@nestjs/common';
import { UnionRepository } from '../../infrastructure/repositories/union.repository.js';
import { UpdateUnionDto } from '../dtos/update-union.dto.js';
import { UnionResponseDto } from '../dtos/union.response.dto.js';

@Injectable()
export class UpdateUnionUseCase {
  constructor(private readonly unionRepo: UnionRepository) {}

  async execute(id: string, dto: UpdateUnionDto): Promise<UnionResponseDto> {
    const entity = await this.unionRepo.update(id, dto);
    if (!entity) {
      throw new NotFoundException('Union no encontrada');
    }
    return { id: entity.id, name: entity.name, country: entity.country };
  }
}
