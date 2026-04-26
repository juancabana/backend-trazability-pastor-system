import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
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
import type { JwtPayload } from '../../auth/infrastructure/strategies/jwt.strategy.js';
import { CreateOrUpdateReportUseCase } from '../application/use-cases/create-or-update-report.use-case.js';
import { GetReportsByPastorUseCase } from '../application/use-cases/get-reports-by-pastor.use-case.js';
import { GetReportByPastorAndDateUseCase } from '../application/use-cases/get-report-by-pastor-and-date.use-case.js';
import { DeleteReportUseCase } from '../application/use-cases/delete-report.use-case.js';
import { CreateDailyReportDto } from '../application/dtos/create-daily-report.dto.js';
import { DailyReportResponseDto } from '../application/dtos/daily-report.response.dto.js';
import { parseMonth, parseYear } from '../../common/utils/date-range.util.js';

@ApiTags('daily-reports')
@Controller('daily-reports')
export class DailyReportController {
  constructor(
    private readonly createOrUpdateReportUseCase: CreateOrUpdateReportUseCase,
    private readonly getReportsByPastorUseCase: GetReportsByPastorUseCase,
    private readonly getReportByPastorAndDateUseCase: GetReportByPastorAndDateUseCase,
    private readonly deleteReportUseCase: DeleteReportUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PASTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar reporte diario (pastor)' })
  @ApiResponse({ status: 201, type: DailyReportResponseDto })
  createOrUpdate(
    @Request() req: { user: JwtPayload },
    @Body() dto: CreateDailyReportDto,
  ): Promise<DailyReportResponseDto> {
    return this.createOrUpdateReportUseCase.execute(
      req.user.sub,
      req.user.associationId!,
      dto,
    );
  }

  @Get('pastor/:pastorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar reportes de un pastor' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, type: [DailyReportResponseDto] })
  getByPastor(
    @Param('pastorId', new ParseUUIDPipe()) pastorId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<DailyReportResponseDto[]> {
    return this.getReportsByPastorUseCase.execute(
      pastorId,
      month ? parseMonth(month) : undefined,
      year ? parseYear(year) : undefined,
    );
  }

  @Get('pastor/:pastorId/date/:date')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reporte por pastor y fecha' })
  @ApiResponse({ status: 200, type: DailyReportResponseDto })
  getByPastorAndDate(
    @Param('pastorId', new ParseUUIDPipe()) pastorId: string,
    @Param('date') date: string,
  ): Promise<DailyReportResponseDto> {
    return this.getReportByPastorAndDateUseCase.execute(pastorId, date);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PASTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar reporte diario (pastor, periodo actual)' })
  @ApiResponse({ status: 200 })
  delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.deleteReportUseCase.execute(
      id,
      req.user.sub,
      req.user.associationId!,
    );
  }
}
