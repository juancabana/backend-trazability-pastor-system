import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssociationEntity } from '../../domain/entities/association.entity.js';

@Injectable()
export class AssociationRepository {
  constructor(
    @InjectRepository(AssociationEntity)
    private readonly repo: Repository<AssociationEntity>,
  ) {}

  async findAll(): Promise<AssociationEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<AssociationEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(
    data: Partial<AssociationEntity>,
  ): Promise<AssociationEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<AssociationEntity>,
  ): Promise<AssociationEntity | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
