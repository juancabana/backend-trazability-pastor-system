import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { GetActivityCategoriesUseCase } from '../application/use-cases/get-activity-categories.use-case.js';
import { CreateSubcategoryUseCase } from '../application/use-cases/create-subcategory.use-case.js';
import { UpdateSubcategoryUseCase } from '../application/use-cases/update-subcategory.use-case.js';
import { DeleteSubcategoryUseCase } from '../application/use-cases/delete-subcategory.use-case.js';
import { RestoreSubcategoryUseCase } from '../application/use-cases/restore-subcategory.use-case.js';
import { ActivityCategoryResponseDto } from '../application/dtos/activity-category.response.dto.js';
import {
  CreateSubcategoryDto,
  SubcategoryResponseDto,
  UpdateSubcategoryDto,
} from '../application/dtos/subcategory.dto.js';

@ApiTags('activity-categories')
@Controller('activity-categories')
export class ActivityCategoryController {
  constructor(
    private readonly getActivityCategoriesUseCase: GetActivityCategoriesUseCase,
    private readonly createSubcategoryUseCase: CreateSubcategoryUseCase,
    private readonly updateSubcategoryUseCase: UpdateSubcategoryUseCase,
    private readonly deleteSubcategoryUseCase: DeleteSubcategoryUseCase,
    private readonly restoreSubcategoryUseCase: RestoreSubcategoryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías PESCAR con sus secciones' })
  @ApiResponse({ status: 200, type: [ActivityCategoryResponseDto] })
  getAll(): Promise<ActivityCategoryResponseDto[]> {
    return this.getActivityCategoriesUseCase.execute();
  }

  // ── Gestión de secciones (admin) ────────────────────────────────────────────

  @Post(':categoryId/subcategories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar una sección a una categoría PESCAR (admin)' })
  @ApiResponse({ status: 201, type: SubcategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  createSubcategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubcategoryDto,
  ): Promise<SubcategoryResponseDto> {
    return this.createSubcategoryUseCase.execute(categoryId, dto);
  }

  @Patch(':categoryId/subcategories/:subcategoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una sección de una categoría PESCAR (admin)' })
  @ApiResponse({ status: 200, type: SubcategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoría o sección no encontrada' })
  updateSubcategory(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
    @Body() dto: UpdateSubcategoryDto,
  ): Promise<SubcategoryResponseDto> {
    return this.updateSubcategoryUseCase.execute(categoryId, subcategoryId, dto);
  }

  @Delete(':categoryId/subcategories/:subcategoryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desactivar una sección de una categoría PESCAR (admin)',
    description:
      'Borrado lógico (isActive = false). La sección queda oculta en nuevos reportes pero los reportes históricos la siguen referenciando correctamente.',
  })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Categoría o sección no encontrada' })
  deleteSubcategory(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
  ): Promise<void> {
    return this.deleteSubcategoryUseCase.execute(categoryId, subcategoryId);
  }

  @Patch(':categoryId/subcategories/:subcategoryId/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivar una sección desactivada (admin)' })
  @ApiResponse({ status: 200, type: SubcategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Categoría o sección no encontrada' })
  restoreSubcategory(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
  ): Promise<SubcategoryResponseDto> {
    return this.restoreSubcategoryUseCase.execute(categoryId, subcategoryId);
  }
}
