import { Injectable, NotFoundException } from '@nestjs/common';
import { AssociationRepository } from '../../infrastructure/repositories/association.repository.js';
import { UpdateAssociationDto } from '../dtos/update-association.dto.js';
import { AssociationResponseDto } from '../dtos/association.response.dto.js';

@Injectable()
export class UpdateAssociationUseCase {
  constructor(private readonly repo: AssociationRepository) {}

  async execute(
    id: string,
    dto: UpdateAssociationDto,
  ): Promise<AssociationResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException('Asociacion no encontrada');
    }

    const updates: Record<string, unknown> = {};
    if (dto.name) updates.name = dto.name.trim();
    if (dto.union) updates.union = dto.union.trim();
    if (dto.country) updates.country = dto.country.trim();
    if (dto.reportDeadlineDay !== undefined)
      updates.reportDeadlineDay = dto.reportDeadlineDay;

    const updated = await this.repo.update(id, updates);
    if (!updated) {
      throw new NotFoundException('Asociacion no encontrada');
    }

    return {
      id: updated.id,
      name: updated.name,
      union: updated.union,
      country: updated.country,
      reportDeadlineDay: updated.reportDeadlineDay,
    };
  }
}
