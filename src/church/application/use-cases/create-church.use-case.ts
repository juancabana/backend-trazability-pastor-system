import { Injectable } from '@nestjs/common';
import { ChurchRepository } from '../../infrastructure/repositories/church.repository.js';
import { CreateChurchDto } from '../dtos/create-church.dto.js';
import { ChurchResponseDto } from '../dtos/church.response.dto.js';

@Injectable()
export class CreateChurchUseCase {
  constructor(private readonly churchRepo: ChurchRepository) {}

  async execute(dto: CreateChurchDto): Promise<ChurchResponseDto> {
    const church = await this.churchRepo.create({
      name: dto.name.trim(),
      address: dto.address?.trim() ?? null,
      districtId: dto.districtId,
    });

    return {
      id: church.id,
      name: church.name,
      address: church.address,
      districtId: church.districtId,
    };
  }
}
