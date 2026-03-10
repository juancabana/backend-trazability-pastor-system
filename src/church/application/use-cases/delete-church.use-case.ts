import { Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRepository } from '../../infrastructure/repositories/church.repository.js';

@Injectable()
export class DeleteChurchUseCase {
  constructor(private readonly churchRepo: ChurchRepository) {}

  async execute(id: string): Promise<void> {
    const church = await this.churchRepo.findById(id);
    if (!church) {
      throw new NotFoundException('Iglesia no encontrada');
    }
    await this.churchRepo.delete(id);
  }
}
