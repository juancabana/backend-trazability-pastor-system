import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityCategoryEntity } from '../../domain/entities/activity-category.entity.js';

@Injectable()
export class ActivityCategoryRepository {
  constructor(
    @InjectRepository(ActivityCategoryEntity)
    private readonly repo: Repository<ActivityCategoryEntity>,
  ) {}

  async findAll(): Promise<ActivityCategoryEntity[]> {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  async findById(id: string): Promise<ActivityCategoryEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(
    entity: Partial<ActivityCategoryEntity>,
  ): Promise<ActivityCategoryEntity> {
    return this.repo.save(this.repo.create(entity));
  }
}
