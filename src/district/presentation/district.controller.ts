import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { GetDistrictsUseCase } from '../application/use-cases/get-districts.use-case.js';
import { CreateDistrictUseCase } from '../application/use-cases/create-district.use-case.js';
import { UpdateDistrictUseCase } from '../application/use-cases/update-district.use-case.js';
import { CreateDistrictDto } from '../application/dtos/create-district.dto.js';
import { UpdateDistrictDto } from '../application/dtos/update-district.dto.js';
import { DistrictResponseDto } from '../application/dtos/district.response.dto.js';

@ApiTags('districts')
@Controller('districts')
export class DistrictController {
  constructor(
    private readonly getDistrictsUseCase: GetDistrictsUseCase,
    private readonly createDistrictUseCase: CreateDistrictUseCase,
    private readonly updateDistrictUseCase: UpdateDistrictUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar distritos (filtrable por asociacion)' })
  @ApiQuery({ name: 'associationId', required: false })
  @ApiResponse({ status: 200, type: [DistrictResponseDto] })
  getAll(
    @Query('associationId') associationId?: string,
  ): Promise<DistrictResponseDto[]> {
    return this.getDistrictsUseCase.execute(associationId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear distrito (admin)' })
  @ApiResponse({ status: 201, type: DistrictResponseDto })
  create(@Body() dto: CreateDistrictDto): Promise<DistrictResponseDto> {
    return this.createDistrictUseCase.execute(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar distrito (admin)' })
  @ApiResponse({ status: 200, type: DistrictResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDistrictDto,
  ): Promise<DistrictResponseDto> {
    return this.updateDistrictUseCase.execute(id, dto);
  }
}
