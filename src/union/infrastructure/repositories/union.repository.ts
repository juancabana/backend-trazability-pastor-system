import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnionEntity } from '../../domain/entities/union.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';

@Injectable()
export class UnionRepository extends BaseRepository<UnionEntity> {
  constructor(
    @InjectRepository(UnionEntity)
    repo: Repository<UnionEntity>,
  ) {
    super(repo);
  }

  findAll(): Promise<UnionEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }
}
