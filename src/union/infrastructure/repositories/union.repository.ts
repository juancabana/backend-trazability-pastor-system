import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnionEntity } from '../../domain/entities/union.entity.js';

@Injectable()
export class UnionRepository {
  constructor(
    @InjectRepository(UnionEntity)
    private readonly repo: Repository<UnionEntity>,
  ) {}

  async findAll(): Promise<UnionEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<UnionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<UnionEntity>): Promise<UnionEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<UnionEntity>,
  ): Promise<UnionEntity | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
