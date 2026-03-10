import { Injectable } from '@nestjs/common';
import { ChurchRepository } from '../../infrastructure/repositories/church.repository.js';
import { DistrictRepository } from '../../../district/infrastructure/repositories/district.repository.js';
import { ChurchResponseDto } from '../dtos/church.response.dto.js';

@Injectable()
export class GetChurchesUseCase {
  constructor(
    private readonly churchRepo: ChurchRepository,
    private readonly districtRepo: DistrictRepository,
  ) {}

  async execute(districtId?: string, associationId?: string): Promise<ChurchResponseDto[]> {
    let churches;

    if (districtId) {
      churches = await this.churchRepo.findByDistrict(districtId);
    } else if (associationId) {
      const districts = await this.districtRepo.findByAssociation(associationId);
      const districtIds = districts.map((d) => d.id);
      churches = await this.churchRepo.findByDistricts(districtIds);
    } else {
      churches = await this.churchRepo.findAll();
    }

    return churches.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      districtId: c.districtId,
    }));
  }
}
