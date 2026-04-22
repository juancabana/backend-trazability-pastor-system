import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChurchEntity } from '../../domain/entities/church.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';

@Injectable()
export class ChurchRepository extends BaseRepository<ChurchEntity> {
  constructor(
    @InjectRepository(ChurchEntity)
    repo: Repository<ChurchEntity>,
  ) {
    super(repo);
  }

  findAll(): Promise<ChurchEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findByDistrict(districtId: string): Promise<ChurchEntity[]> {
    return this.repo.find({
      where: { districtId },
      order: { name: 'ASC' },
    });
  }

  findByDistricts(districtIds: string[]): Promise<ChurchEntity[]> {
    if (districtIds.length === 0) return Promise.resolve([]);
    return this.repo.find({
      where: { districtId: In(districtIds) },
      order: { name: 'ASC' },
    });
  }

  countByDistrict(districtId: string): Promise<number> {
    return this.repo.count({ where: { districtId } });
  }
}
