import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityCategoryEntity } from './domain/entities/activity-category.entity.js';
import { ActivityCategoryRepository } from './infrastructure/repositories/activity-category.repository.js';
import { GetActivityCategoriesUseCase } from './application/use-cases/get-activity-categories.use-case.js';
import { ActivityCategoryController } from './presentation/activity-category.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityCategoryEntity])],
  controllers: [ActivityCategoryController],
  providers: [ActivityCategoryRepository, GetActivityCategoriesUseCase],
  exports: [ActivityCategoryRepository],
})
export class ActivityCategoryModule {}
