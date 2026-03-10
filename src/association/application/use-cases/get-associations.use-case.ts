import { Injectable } from '@nestjs/common';
import { AssociationRepository } from '../../infrastructure/repositories/association.repository.js';
import { AssociationResponseDto } from '../dtos/association.response.dto.js';

@Injectable()
export class GetAssociationsUseCase {
  constructor(private readonly repo: AssociationRepository) {}

  async execute(unionId?: string): Promise<AssociationResponseDto[]> {
    const associations = unionId
      ? await this.repo.findByUnion(unionId)
      : await this.repo.findAll();
    return associations.map((a) => ({
      id: a.id,
      name: a.name,
      unionId: a.unionId,
      country: a.country,
      reportDeadlineDay: a.reportDeadlineDay,
    }));
  }
}
