import { Injectable } from '@nestjs/common';
import { DistrictRepository } from '../../infrastructure/repositories/district.repository.js';
import { CreateDistrictDto } from '../dtos/create-district.dto.js';
import { DistrictResponseDto } from '../dtos/district.response.dto.js';

@Injectable()
export class CreateDistrictUseCase {
  constructor(private readonly repo: DistrictRepository) {}

  async execute(dto: CreateDistrictDto): Promise<DistrictResponseDto> {
    const district = await this.repo.create({
      name: dto.name.trim(),
      associationId: dto.associationId,
    });

    return {
      id: district.id,
      name: district.name,
      associationId: district.associationId,
    };
  }
}
