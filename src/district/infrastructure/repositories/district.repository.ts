import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistrictEntity } from '../../domain/entities/district.entity.js';

@Injectable()
export class DistrictRepository {
  constructor(
    @InjectRepository(DistrictEntity)
    private readonly repo: Repository<DistrictEntity>,
  ) {}

  async findAll(): Promise<DistrictEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findByAssociation(associationId: string): Promise<DistrictEntity[]> {
    return this.repo.find({
      where: { associationId },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<DistrictEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<DistrictEntity>): Promise<DistrictEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<DistrictEntity>,
  ): Promise<DistrictEntity | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
