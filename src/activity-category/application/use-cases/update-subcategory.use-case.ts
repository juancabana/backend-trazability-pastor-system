import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityCategoryRepository } from '../../infrastructure/repositories/activity-category.repository.js';
import type { UpdateSubcategoryDto, SubcategoryResponseDto } from '../dtos/subcategory.dto.js';

@Injectable()
export class UpdateSubcategoryUseCase {
  constructor(private readonly repo: ActivityCategoryRepository) {}

  async execute(
    categoryId: string,
    subcategoryId: string,
    dto: UpdateSubcategoryDto,
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

    const current = category.subcategories[index];
    const updated = {
      ...current,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.hasHours !== undefined && { hasHours: dto.hasHours }),
      ...(dto.description !== undefined && { description: dto.description?.trim() }),
    };

    const newSubcategories = [...category.subcategories];
    newSubcategories[index] = updated;

    const saved = await this.repo.saveSubcategories(categoryId, newSubcategories);
    const result = saved!.subcategories[index];
    return { ...result, isActive: result.isActive ?? true };
  }
}
