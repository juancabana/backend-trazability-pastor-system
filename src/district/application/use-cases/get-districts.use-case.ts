import { Injectable } from '@nestjs/common';
import { DistrictRepository } from '../../infrastructure/repositories/district.repository.js';
import { DistrictResponseDto } from '../dtos/district.response.dto.js';

@Injectable()
export class GetDistrictsUseCase {
  constructor(private readonly repo: DistrictRepository) {}

  async execute(associationId?: string): Promise<DistrictResponseDto[]> {
    const districts = associationId
      ? await this.repo.findByAssociation(associationId)
      : await this.repo.findAll();

    return districts.map((d) => ({
      id: d.id,
      name: d.name,
      associationId: d.associationId,
    }));
  }
}
