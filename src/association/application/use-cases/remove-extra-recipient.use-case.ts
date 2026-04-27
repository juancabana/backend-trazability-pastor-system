import { Injectable, NotFoundException } from '@nestjs/common';
import { ExtraRecipientRepository } from '../../infrastructure/repositories/extra-recipient.repository.js';

@Injectable()
export class RemoveExtraRecipientUseCase {
  constructor(private readonly repo: ExtraRecipientRepository) {}

  async execute(associationId: string, recipientId: string): Promise<void> {
    const existing = await this.repo.findOne(recipientId, associationId);
    if (!existing) {
      throw new NotFoundException(
        'Destinatario externo no encontrado en esta asociación',
      );
    }
    await this.repo.deleteById(recipientId, associationId);
  }
}
