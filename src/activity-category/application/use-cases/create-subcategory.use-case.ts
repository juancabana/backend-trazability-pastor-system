import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ActivityCategoryRepository } from '../../infrastructure/repositories/activity-category.repository.js';
import type { CreateSubcategoryDto, SubcategoryResponseDto } from '../dtos/subcategory.dto.js';

@Injectable()
export class CreateSubcategoryUseCase {
  constructor(private readonly repo: ActivityCategoryRepository) {}

  async execute(
    categoryId: string,
    dto: CreateSubcategoryDto,
  ): Promise<SubcategoryResponseDto> {
    const category = await this.repo.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Categoría '${categoryId}' no encontrada`);
    }

    const newSub = {
      id: randomUUID(),
      name: dto.name.trim(),
      unit: dto.unit,
      hasHours: dto.hasHours,
      description: dto.description?.trim(),
      isActive: true,
    };

    const updated = await this.repo.saveSubcategories(categoryId, [
      ...category.subcategories,
      newSub,
    ]);

    const saved = updated!.subcategories.find((s) => s.id === newSub.id)!;
    return { ...saved, isActive: saved.isActive ?? true };
  }
}
