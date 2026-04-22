import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
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
import { GetConsolidatedByPastorUseCase } from '../application/use-cases/get-consolidated-by-pastor.use-case.js';
import { GetConsolidatedByAssociationUseCase } from '../application/use-cases/get-consolidated-by-association.use-case.js';
import {
  GetConsolidatedByUnionUseCase,
  UnionConsolidatedResponseDto,
} from '../application/use-cases/get-consolidated-by-union.use-case.js';
import {
  ConsolidatedResponseDto,
  AssociationConsolidatedResponseDto,
} from '../application/dtos/consolidated.response.dto.js';
import { validateMonthYear } from '../../common/utils/date-range.util.js';

@ApiTags('consolidated')
@Controller('consolidated')
export class ConsolidatedController {
  constructor(
    private readonly getByPastorUseCase: GetConsolidatedByPastorUseCase,
    private readonly getByAssociationUseCase: GetConsolidatedByAssociationUseCase,
    private readonly getByUnionUseCase: GetConsolidatedByUnionUseCase,
  ) {}

  @Get('pastor/:pastorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consolidado por pastor (mes/ano)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiResponse({ status: 200, type: ConsolidatedResponseDto })
  getByPastor(
    @Param('pastorId', new ParseUUIDPipe()) pastorId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ): Promise<ConsolidatedResponseDto> {
    const { m, y } = validateMonthYear(month, year);
    return this.getByPastorUseCase.execute(pastorId, m, y);
  }

  @Get('association/:associationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consolidado por asociacion (admin, mes/ano)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiResponse({ status: 200, type: AssociationConsolidatedResponseDto })
  getByAssociation(
    @Param('associationId', new ParseUUIDPipe()) associationId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ): Promise<AssociationConsolidatedResponseDto> {
    const { m, y } = validateMonthYear(month, year);
    return this.getByAssociationUseCase.execute(associationId, m, y);
  }

  @Get('union/:unionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consolidado por union (super_admin, mes/ano)' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  getByUnion(
    @Param('unionId', new ParseUUIDPipe()) unionId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ): Promise<UnionConsolidatedResponseDto> {
    const { m, y } = validateMonthYear(month, year);
    return this.getByUnionUseCase.execute(unionId, m, y);
  }
}
