import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { GetConsolidatedByPastorUseCase } from '../application/use-cases/get-consolidated-by-pastor.use-case.js';
import { GetConsolidatedByAssociationUseCase } from '../application/use-cases/get-consolidated-by-association.use-case.js';
import { GetConsolidatedByPastorsUseCase } from '../application/use-cases/get-consolidated-by-pastors.use-case.js';
import {
  GetConsolidatedByUnionUseCase,
  UnionConsolidatedResponseDto,
} from '../application/use-cases/get-consolidated-by-union.use-case.js';
import {
  ConsolidatedResponseDto,
  AssociationConsolidatedResponseDto,
} from '../application/dtos/consolidated.response.dto.js';
import { parsePeriodOffset } from '../../common/utils/period.util.js';
import { SendConsolidatedReportUseCase } from '../application/use-cases/send-consolidated-report.use-case.js';
import {
  SendConsolidatedReportDto,
  SendConsolidatedReportResponseDto,
} from './dtos/send-consolidated-report.dto.js';

@ApiTags('consolidated')
@Controller('consolidated')
export class ConsolidatedController {
  constructor(
    private readonly getByPastorUseCase: GetConsolidatedByPastorUseCase,
    private readonly getByAssociationUseCase: GetConsolidatedByAssociationUseCase,
    private readonly getByPastorsUseCase: GetConsolidatedByPastorsUseCase,
    private readonly getByUnionUseCase: GetConsolidatedByUnionUseCase,
    private readonly sendReportUseCase: SendConsolidatedReportUseCase,
  ) {}

  @Get('pastor/:pastorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Consolidado por pastor para un periodo (offset relativo al actual).',
  })
  @ApiQuery({
    name: 'periodOffset',
    required: false,
    type: Number,
    description: '0=actual, -1=anterior, +1=siguiente. Default: 0.',
  })
  @ApiResponse({ status: 200, type: ConsolidatedResponseDto })
  getByPastor(
    @Param('pastorId', new ParseUUIDPipe()) pastorId: string,
    @Query('periodOffset') periodOffset?: string,
  ): Promise<ConsolidatedResponseDto> {
    const offset = parsePeriodOffset(periodOffset);
    return this.getByPastorUseCase.execute(pastorId, offset);
  }

  @Get('association/:associationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_READONLY)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Consolidado por asociacion para un periodo (admin/readonly).',
  })
  @ApiQuery({ name: 'periodOffset', required: false, type: Number })
  @ApiResponse({ status: 200, type: AssociationConsolidatedResponseDto })
  getByAssociation(
    @Param('associationId', new ParseUUIDPipe()) associationId: string,
    @Query('periodOffset') periodOffset?: string,
  ): Promise<AssociationConsolidatedResponseDto> {
    const offset = parsePeriodOffset(periodOffset);
    return this.getByAssociationUseCase.execute(associationId, offset);
  }

  @Get('custom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_READONLY)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Consolidado personalizado por pastores seleccionados para un periodo.',
  })
  @ApiQuery({
    name: 'pastorIds',
    required: true,
    description: 'UUIDs de pastores separados por coma',
  })
  @ApiQuery({ name: 'periodOffset', required: false, type: Number })
  @ApiResponse({ status: 200, type: AssociationConsolidatedResponseDto })
  getByPastors(
    @Query('pastorIds') pastorIds: string,
    @Query('periodOffset') periodOffset?: string,
  ): Promise<AssociationConsolidatedResponseDto> {
    const ids = (pastorIds ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    const offset = parsePeriodOffset(periodOffset);
    return this.getByPastorsUseCase.execute(ids, offset);
  }

  @Get('union/:unionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consolidado por union para un periodo (super_admin).',
  })
  @ApiQuery({ name: 'periodOffset', required: false, type: Number })
  getByUnion(
    @Param('unionId', new ParseUUIDPipe()) unionId: string,
    @Query('periodOffset') periodOffset?: string,
  ): Promise<UnionConsolidatedResponseDto> {
    const offset = parsePeriodOffset(periodOffset);
    return this.getByUnionUseCase.execute(unionId, offset);
  }

  @Post('send-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar consolidado por correo a administradores seleccionados',
  })
  @ApiResponse({ status: 200, type: SendConsolidatedReportResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Sin destinatarios o IDs inválidos',
  })
  sendReport(
    @Body() dto: SendConsolidatedReportDto,
  ): Promise<SendConsolidatedReportResponseDto> {
    return this.sendReportUseCase.execute(dto);
  }
}

