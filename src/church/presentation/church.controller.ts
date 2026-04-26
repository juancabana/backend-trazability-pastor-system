import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { GetChurchesUseCase } from '../application/use-cases/get-churches.use-case.js';
import { CreateChurchUseCase } from '../application/use-cases/create-church.use-case.js';
import { UpdateChurchUseCase } from '../application/use-cases/update-church.use-case.js';
import { DeleteChurchUseCase } from '../application/use-cases/delete-church.use-case.js';
import { CreateChurchDto } from '../application/dtos/create-church.dto.js';
import {
  UpdateChurchDto,
  MoveChurchDto,
} from '../application/dtos/update-church.dto.js';
import { ChurchResponseDto } from '../application/dtos/church.response.dto.js';

@ApiTags('churches')
@Controller('churches')
export class ChurchController {
  constructor(
    private readonly getChurchesUseCase: GetChurchesUseCase,
    private readonly createChurchUseCase: CreateChurchUseCase,
    private readonly updateChurchUseCase: UpdateChurchUseCase,
    private readonly deleteChurchUseCase: DeleteChurchUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar iglesias (filtro por distrito o asociacion)',
  })
  @ApiResponse({ status: 200, type: [ChurchResponseDto] })
  getAll(
    @Query('districtId') districtId?: string,
    @Query('associationId') associationId?: string,
  ): Promise<ChurchResponseDto[]> {
    return this.getChurchesUseCase.execute(districtId, associationId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear iglesia (admin)' })
  @ApiResponse({ status: 201, type: ChurchResponseDto })
  create(@Body() dto: CreateChurchDto): Promise<ChurchResponseDto> {
    return this.createChurchUseCase.execute(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar iglesia (admin)' })
  @ApiResponse({ status: 200, type: ChurchResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateChurchDto,
  ): Promise<ChurchResponseDto> {
    return this.updateChurchUseCase.execute(id, dto);
  }

  @Patch(':id/move')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mover iglesia a otro distrito (admin)' })
  @ApiResponse({ status: 200, type: ChurchResponseDto })
  move(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MoveChurchDto,
  ): Promise<ChurchResponseDto> {
    return this.updateChurchUseCase.move(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar iglesia (admin)' })
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.deleteChurchUseCase.execute(id);
  }
}
