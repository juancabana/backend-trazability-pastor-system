import { Injectable, NotFoundException } from '@nestjs/common';
import { DistrictRepository } from '../../infrastructure/repositories/district.repository.js';
import { UpdateDistrictDto } from '../dtos/update-district.dto.js';
import { DistrictResponseDto } from '../dtos/district.response.dto.js';

@Injectable()
export class UpdateDistrictUseCase {
  constructor(private readonly repo: DistrictRepository) {}

  async execute(
    id: string,
    dto: UpdateDistrictDto,
  ): Promise<DistrictResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('Distrito no encontrado');
    }

    const updates: Record<string, unknown> = {};
    if (dto.name) updates.name = dto.name.trim();

    const updated = await this.repo.update(id, updates);
    if (!updated) {
      throw new NotFoundException('Distrito no encontrado');
    }

    return {
      id: updated.id,
      name: updated.name,
      associationId: updated.associationId,
    };
  }
}
