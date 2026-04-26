import { Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRepository } from '../../infrastructure/repositories/church.repository.js';
import { UpdateChurchDto, MoveChurchDto } from '../dtos/update-church.dto.js';
import { ChurchResponseDto } from '../dtos/church.response.dto.js';

@Injectable()
export class UpdateChurchUseCase {
  constructor(private readonly churchRepo: ChurchRepository) {}

  async execute(id: string, dto: UpdateChurchDto): Promise<ChurchResponseDto> {
    const updates: Record<string, unknown> = {};
    if (dto.name) updates.name = dto.name.trim();
    if (dto.address !== undefined)
      updates.address = dto.address?.trim() ?? null;

    const church = await this.churchRepo.update(id, updates);
    if (!church) {
      throw new NotFoundException('Iglesia no encontrada');
    }

    return {
      id: church.id,
      name: church.name,
      address: church.address,
      districtId: church.districtId,
    };
  }

  async move(id: string, dto: MoveChurchDto): Promise<ChurchResponseDto> {
    const church = await this.churchRepo.update(id, {
      districtId: dto.districtId,
    });
    if (!church) {
      throw new NotFoundException('Iglesia no encontrada');
    }

    return {
      id: church.id,
      name: church.name,
      address: church.address,
      districtId: church.districtId,
    };
  }
}
