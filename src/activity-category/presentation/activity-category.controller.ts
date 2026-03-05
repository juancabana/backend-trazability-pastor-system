import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetActivityCategoriesUseCase } from '../application/use-cases/get-activity-categories.use-case.js';
import { ActivityCategoryResponseDto } from '../application/dtos/activity-category.response.dto.js';

@ApiTags('activity-categories')
@Controller('activity-categories')
export class ActivityCategoryController {
  constructor(
    private readonly getActivityCategoriesUseCase: GetActivityCategoriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorias de actividades' })
  @ApiResponse({ status: 200, type: [ActivityCategoryResponseDto] })
  getAll(): Promise<ActivityCategoryResponseDto[]> {
    return this.getActivityCategoriesUseCase.execute();
  }
}
