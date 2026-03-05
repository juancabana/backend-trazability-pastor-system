import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
import { GetAssociationsUseCase } from '../application/use-cases/get-associations.use-case.js';
import { CreateAssociationUseCase } from '../application/use-cases/create-association.use-case.js';
import { UpdateAssociationUseCase } from '../application/use-cases/update-association.use-case.js';
import { CreateAssociationDto } from '../application/dtos/create-association.dto.js';
import { UpdateAssociationDto } from '../application/dtos/update-association.dto.js';
import { AssociationResponseDto } from '../application/dtos/association.response.dto.js';

@ApiTags('associations')
@Controller('associations')
export class AssociationController {
  constructor(
    private readonly getAssociationsUseCase: GetAssociationsUseCase,
    private readonly createAssociationUseCase: CreateAssociationUseCase,
    private readonly updateAssociationUseCase: UpdateAssociationUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las asociaciones' })
  @ApiResponse({ status: 200, type: [AssociationResponseDto] })
  getAll(): Promise<AssociationResponseDto[]> {
    return this.getAssociationsUseCase.execute();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear asociacion (admin)' })
  @ApiResponse({ status: 201, type: AssociationResponseDto })
  create(@Body() dto: CreateAssociationDto): Promise<AssociationResponseDto> {
    return this.createAssociationUseCase.execute(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar asociacion (admin)' })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssociationDto,
  ): Promise<AssociationResponseDto> {
    return this.updateAssociationUseCase.execute(id, dto);
  }
}
