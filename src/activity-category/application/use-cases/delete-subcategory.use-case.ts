import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityCategoryRepository } from '../../infrastructure/repositories/activity-category.repository.js';

@Injectable()
export class DeleteSubcategoryUseCase {
  constructor(private readonly repo: ActivityCategoryRepository) {}

  /**
   * Soft-deletes a subcategory by setting isActive = false.
   * The subcategory remains in the JSONB array so historical reports
   * that reference it still resolve the name correctly.
   */
  async execute(categoryId: string, subcategoryId: string): Promise<void> {
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
      s.id === subcategoryId ? { ...s, isActive: false } : s,
    );

    await this.repo.saveSubcategories(categoryId, newSubcategories);
  }
}
