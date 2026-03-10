import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChurchEntity } from '../../domain/entities/church.entity.js';

@Injectable()
export class ChurchRepository {
  constructor(
    @InjectRepository(ChurchEntity)
    private readonly repo: Repository<ChurchEntity>,
  ) {}

  async findAll(): Promise<ChurchEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<ChurchEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByDistrict(districtId: string): Promise<ChurchEntity[]> {
    return this.repo.find({
      where: { districtId },
      order: { name: 'ASC' },
    });
  }

  async findByDistricts(districtIds: string[]): Promise<ChurchEntity[]> {
    if (districtIds.length === 0) return [];
    return this.repo.find({
      where: { districtId: In(districtIds) },
      order: { name: 'ASC' },
    });
  }

  async create(data: Partial<ChurchEntity>): Promise<ChurchEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    id: string,
    data: Partial<ChurchEntity>,
  ): Promise<ChurchEntity | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async countByDistrict(districtId: string): Promise<number> {
    return this.repo.count({ where: { districtId } });
  }
}
