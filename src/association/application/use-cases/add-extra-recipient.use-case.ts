import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ExtraRecipientRepository } from '../../infrastructure/repositories/extra-recipient.repository.js';
import type {
  AddExtraRecipientDto,
  ExtraRecipientResponseDto,
} from '../dtos/extra-recipient.dto.js';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class AddExtraRecipientUseCase {
  constructor(private readonly repo: ExtraRecipientRepository) {}

  async execute(
    associationId: string,
    dto: AddExtraRecipientDto,
  ): Promise<ExtraRecipientResponseDto> {
    try {
      const entity = await this.repo.create({
        associationId,
        email: dto.email.toLowerCase().trim(),
        name: dto.name.trim(),
      });
      return {
        id: entity.id,
        associationId: entity.associationId,
        email: entity.email,
        name: entity.name,
        createdAt: entity.createdAt,
      };
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        String((err as any).code) === '23505'
      ) {
        throw new ConflictException(
          `El correo ${dto.email} ya está registrado como destinatario de esta asociación`,
        );
      }
      throw err;
    }
  }
}
