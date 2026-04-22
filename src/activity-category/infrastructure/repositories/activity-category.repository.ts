import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityCategoryEntity } from '../../domain/entities/activity-category.entity.js';
import { BaseRepository } from '../../../common/repositories/base.repository.js';

@Injectable()
export class ActivityCategoryRepository extends BaseRepository<ActivityCategoryEntity> {
  constructor(
    @InjectRepository(ActivityCategoryEntity)
    repo: Repository<ActivityCategoryEntity>,
  ) {
    super(repo);
  }

  findAll(): Promise<ActivityCategoryEntity[]> {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }
}
