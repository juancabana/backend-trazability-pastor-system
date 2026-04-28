import {
  Controller,
  Get,
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
import { GetAuditLogsUseCase } from '../application/use-cases/get-audit-logs.use-case.js';
import { AuditLogQueryDto } from '../application/dtos/audit-log-query.dto.js';
import { PaginatedAuditLogResponseDto } from '../application/dtos/audit-log.response.dto.js';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly getAuditLogsUseCase: GetAuditLogsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obtener registros de auditoría (solo owner)' })
  @ApiResponse({ status: 200, type: PaginatedAuditLogResponseDto })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  getAuditLogs(
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedAuditLogResponseDto> {
    return this.getAuditLogsUseCase.execute(query);
  }
}
