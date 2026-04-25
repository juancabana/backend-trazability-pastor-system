import { Injectable, NotFoundException } from '@nestjs/common';
import { AssociationRepository } from '../../infrastructure/repositories/association.repository.js';
import { AssociationResponseDto } from '../dtos/association.response.dto.js';

@Injectable()
export class UpdateAssociationDeadlineUseCase {
  constructor(private readonly repo: AssociationRepository) {}

  async execute(
    associationId: string,
    reportDeadlineDay: number,
  ): Promise<AssociationResponseDto> {
    const existing = await this.repo.findById(associationId);
    if (!existing) {
      throw new NotFoundException('Asociacion no encontrada');
    }

    const updated = await this.repo.update(associationId, {
      reportDeadlineDay,
    });

    if (!updated) {
      throw new NotFoundException('Asociacion no encontrada');
    }

    return {
      id: updated.id,
      name: updated.name,
      unionId: updated.unionId,
      country: updated.country,
      reportDeadlineDay: updated.reportDeadlineDay,
    };
  }
}
