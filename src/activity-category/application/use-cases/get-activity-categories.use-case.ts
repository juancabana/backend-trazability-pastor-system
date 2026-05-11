import { Injectable } from '@nestjs/common';
import { ActivityCategoryRepository } from '../../infrastructure/repositories/activity-category.repository.js';
import { ActivityCategoryResponseDto } from '../dtos/activity-category.response.dto.js';

@Injectable()
export class GetActivityCategoriesUseCase {
  constructor(private readonly repo: ActivityCategoryRepository) {}

  async execute(): Promise<ActivityCategoryResponseDto[]> {
    const categories = await this.repo.findAll();
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      bgColor: c.bgColor,
      borderColor: c.borderColor,
      // Normalize legacy rows that predate the isActive field (treat missing as true)
      subcategories: c.subcategories.map((s) => ({
        ...s,
        isActive: s.isActive ?? true,
      })),
      sortOrder: c.sortOrder,
    }));
  }
}
