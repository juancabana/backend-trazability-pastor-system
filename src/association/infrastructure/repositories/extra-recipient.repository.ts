import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssociationExtraRecipientEntity } from '../../domain/entities/association-extra-recipient.entity.js';

@Injectable()
export class ExtraRecipientRepository {
  constructor(
    @InjectRepository(AssociationExtraRecipientEntity)
    private readonly repo: Repository<AssociationExtraRecipientEntity>,
  ) {}

  findByAssociation(
    associationId: string,
  ): Promise<AssociationExtraRecipientEntity[]> {
    return this.repo.find({
      where: { associationId },
      order: { name: 'ASC' },
    });
  }

  findByIds(
    ids: string[],
    associationId: string,
  ): Promise<AssociationExtraRecipientEntity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo.find({ where: { id: In(ids), associationId } });
  }

  findOne(
    id: string,
    associationId: string,
  ): Promise<AssociationExtraRecipientEntity | null> {
    return this.repo.findOne({ where: { id, associationId } });
  }

  async create(data: {
    associationId: string;
    email: string;
    name: string;
  }): Promise<AssociationExtraRecipientEntity> {
    const entity = this.repo.create({
      id: undefined,
      ...data,
    });
    return this.repo.save(entity);
  }

  async deleteById(id: string, associationId: string): Promise<void> {
    await this.repo.delete({ id, associationId });
  }
}
