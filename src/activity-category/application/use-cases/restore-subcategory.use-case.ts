import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityCategoryRepository } from '../../infrastructure/repositories/activity-category.repository.js';
import type { SubcategoryResponseDto } from '../dtos/subcategory.dto.js';

@Injectable()
export class RestoreSubcategoryUseCase {
  constructor(private readonly repo: ActivityCategoryRepository) {}

  async execute(
    categoryId: string,
    subcategoryId: string,
  ): Promise<SubcategoryResponseDto> {
    const category = await this.repo.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Categoría '${categoryId}' no encontrada`);
    }

    const index = category.subcategories.findIndex((s) => s.id === subcategoryId);
    if (index === -1) {
      throw new NotFoundException(
        `Sección '${subcategoryId}' no encontrada en la categoría '${categoryId}'`,
      );
    }

    const newSubcategories = category.subcategories.map((s) =>
      s.id === subcategoryId ? { ...s, isActive: true } : s,
    );

    const saved = await this.repo.saveSubcategories(categoryId, newSubcategories);
    return saved!.subcategories[index];
  }
}
