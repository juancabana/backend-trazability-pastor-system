import { Injectable } from '@nestjs/common';
import { AssociationRepository } from '../../infrastructure/repositories/association.repository.js';
import { AssociationResponseDto } from '../dtos/association.response.dto.js';

@Injectable()
export class GetAssociationsUseCase {
  constructor(private readonly repo: AssociationRepository) {}

  async execute(): Promise<AssociationResponseDto[]> {
    const associations = await this.repo.findAll();
    return associations.map((a) => ({
      id: a.id,
      name: a.name,
      union: a.union,
      country: a.country,
      reportDeadlineDay: a.reportDeadlineDay,
    }));
  }
}
