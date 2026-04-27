import { Injectable } from '@nestjs/common';
import { ExtraRecipientRepository } from '../../infrastructure/repositories/extra-recipient.repository.js';
import type { ExtraRecipientResponseDto } from '../dtos/extra-recipient.dto.js';

@Injectable()
export class GetExtraRecipientsUseCase {
  constructor(private readonly repo: ExtraRecipientRepository) {}

  async execute(associationId: string): Promise<ExtraRecipientResponseDto[]> {
    const rows = await this.repo.findByAssociation(associationId);
    return rows.map((r) => ({
      id: r.id,
      associationId: r.associationId,
      email: r.email,
      name: r.name,
      createdAt: r.createdAt,
    }));
  }
}
