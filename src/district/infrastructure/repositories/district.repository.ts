import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistrictEntity } from '../../domain/entities/district.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';

@Injectable()
export class DistrictRepository extends BaseRepository<DistrictEntity> {
  constructor(
    @InjectRepository(DistrictEntity)
    repo: Repository<DistrictEntity>,
  ) {
    super(repo);
  }

  findAll(): Promise<DistrictEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findByAssociation(associationId: string): Promise<DistrictEntity[]> {
    return this.repo.find({
      where: { associationId },
      order: { name: 'ASC' },
    });
  }
}
