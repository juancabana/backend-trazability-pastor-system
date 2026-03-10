import {
  Body,
  Controller,
  Get,
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
import { GetUnionsUseCase } from '../application/use-cases/get-unions.use-case.js';
import { CreateUnionUseCase } from '../application/use-cases/create-union.use-case.js';
import { UpdateUnionUseCase } from '../application/use-cases/update-union.use-case.js';
import { CreateUnionDto } from '../application/dtos/create-union.dto.js';
import { UpdateUnionDto } from '../application/dtos/update-union.dto.js';
import { UnionResponseDto } from '../application/dtos/union.response.dto.js';

@ApiTags('unions')
@Controller('unions')
export class UnionController {
  constructor(
    private readonly getUnionsUseCase: GetUnionsUseCase,
    private readonly createUnionUseCase: CreateUnionUseCase,
    private readonly updateUnionUseCase: UpdateUnionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las uniones' })
  @ApiResponse({ status: 200, type: [UnionResponseDto] })
  getAll(): Promise<UnionResponseDto[]> {
    return this.getUnionsUseCase.execute();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear union (super_admin)' })
  @ApiResponse({ status: 201, type: UnionResponseDto })
  create(@Body() dto: CreateUnionDto): Promise<UnionResponseDto> {
    return this.createUnionUseCase.execute(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar union (super_admin)' })
  @ApiResponse({ status: 200, type: UnionResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUnionDto,
  ): Promise<UnionResponseDto> {
    return this.updateUnionUseCase.execute(id, dto);
  }
}
