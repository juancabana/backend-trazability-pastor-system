import { Injectable } from '@nestjs/common';
import { AssociationRepository } from '../../infrastructure/repositories/association.repository.js';
import { CreateAssociationDto } from '../dtos/create-association.dto.js';
import { AssociationResponseDto } from '../dtos/association.response.dto.js';

@Injectable()
export class CreateAssociationUseCase {
  constructor(private readonly repo: AssociationRepository) {}

  async execute(dto: CreateAssociationDto): Promise<AssociationResponseDto> {
    const association = await this.repo.create({
      name: dto.name.trim(),
      union: dto.union.trim(),
      country: dto.country.trim(),
      reportDeadlineDay: dto.reportDeadlineDay,
    });

    return {
      id: association.id,
      name: association.name,
      union: association.union,
      country: association.country,
      reportDeadlineDay: association.reportDeadlineDay,
    };
  }
}
