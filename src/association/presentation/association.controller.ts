import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
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
import { UpdateAssociationDeadlineUseCase } from '../application/use-cases/update-association-deadline.use-case.js';
import { CreateAssociationDto } from '../application/dtos/create-association.dto.js';
import { UpdateAssociationDto } from '../application/dtos/update-association.dto.js';
import { UpdateDeadlineDayDto } from '../application/dtos/update-deadline-day.dto.js';
import { AssociationResponseDto } from '../application/dtos/association.response.dto.js';

@ApiTags('associations')
@Controller('associations')
export class AssociationController {
  constructor(
    private readonly getAssociationsUseCase: GetAssociationsUseCase,
    private readonly createAssociationUseCase: CreateAssociationUseCase,
    private readonly updateAssociationUseCase: UpdateAssociationUseCase,
    private readonly updateAssociationDeadlineUseCase: UpdateAssociationDeadlineUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las asociaciones' })
  @ApiResponse({ status: 200, type: [AssociationResponseDto] })
  getAll(@Query('unionId') unionId?: string): Promise<AssociationResponseDto[]> {
    return this.getAssociationsUseCase.execute(unionId);
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

  @Patch('my/deadline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar día de cierre de la propia asociación (admin)' })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  updateMyDeadline(
    @Request() req: { user: { associationId: string } },
    @Body() dto: UpdateDeadlineDayDto,
  ): Promise<AssociationResponseDto> {
    return this.updateAssociationDeadlineUseCase.execute(
      req.user.associationId,
      dto.reportDeadlineDay,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar asociacion (admin)' })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssociationDto,
  ): Promise<AssociationResponseDto> {
    return this.updateAssociationUseCase.execute(id, dto);
  }
}
