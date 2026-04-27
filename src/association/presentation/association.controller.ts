import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
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
import type { JwtPayload } from '../../auth/infrastructure/strategies/jwt.strategy.js';
import { GetAssociationsUseCase } from '../application/use-cases/get-associations.use-case.js';
import { CreateAssociationUseCase } from '../application/use-cases/create-association.use-case.js';
import { UpdateAssociationUseCase } from '../application/use-cases/update-association.use-case.js';
import { UpdateAssociationDeadlineUseCase } from '../application/use-cases/update-association-deadline.use-case.js';
import { GetExtraRecipientsUseCase } from '../application/use-cases/get-extra-recipients.use-case.js';
import { AddExtraRecipientUseCase } from '../application/use-cases/add-extra-recipient.use-case.js';
import { RemoveExtraRecipientUseCase } from '../application/use-cases/remove-extra-recipient.use-case.js';
import { CreateAssociationDto } from '../application/dtos/create-association.dto.js';
import { UpdateAssociationDto } from '../application/dtos/update-association.dto.js';
import { UpdateDeadlineDayDto } from '../application/dtos/update-deadline-day.dto.js';
import { AssociationResponseDto } from '../application/dtos/association.response.dto.js';
import {
  AddExtraRecipientDto,
  ExtraRecipientResponseDto,
} from '../application/dtos/extra-recipient.dto.js';

@ApiTags('associations')
@Controller('associations')
export class AssociationController {
  constructor(
    private readonly getAssociationsUseCase: GetAssociationsUseCase,
    private readonly createAssociationUseCase: CreateAssociationUseCase,
    private readonly updateAssociationUseCase: UpdateAssociationUseCase,
    private readonly updateAssociationDeadlineUseCase: UpdateAssociationDeadlineUseCase,
    private readonly getExtraRecipientsUseCase: GetExtraRecipientsUseCase,
    private readonly addExtraRecipientUseCase: AddExtraRecipientUseCase,
    private readonly removeExtraRecipientUseCase: RemoveExtraRecipientUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las asociaciones' })
  @ApiResponse({ status: 200, type: [AssociationResponseDto] })
  getAll(
    @Query('unionId') unionId?: string,
  ): Promise<AssociationResponseDto[]> {
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
  @ApiOperation({
    summary: 'Actualizar día de cierre de la propia asociación (admin)',
  })
  @ApiResponse({ status: 200, type: AssociationResponseDto })
  updateMyDeadline(
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateDeadlineDayDto,
  ): Promise<AssociationResponseDto> {
    return this.updateAssociationDeadlineUseCase.execute(
      req.user.associationId!,
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

  // ── Destinatarios externos de reporte ──────────────────────────────────────

  @Get(':id/extra-recipients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar correos externos guardados para recibir el reporte',
  })
  @ApiResponse({ status: 200, type: [ExtraRecipientResponseDto] })
  getExtraRecipients(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ExtraRecipientResponseDto[]> {
    this.assertOwnsAssociation(req.user, id);
    return this.getExtraRecipientsUseCase.execute(id);
  }

  @Post(':id/extra-recipients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar un correo externo como destinatario' })
  @ApiResponse({ status: 201, type: ExtraRecipientResponseDto })
  @ApiResponse({ status: 409, description: 'El correo ya está registrado' })
  addExtraRecipient(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: { user: JwtPayload },
    @Body() dto: AddExtraRecipientDto,
  ): Promise<ExtraRecipientResponseDto> {
    this.assertOwnsAssociation(req.user, id);
    return this.addExtraRecipientUseCase.execute(id, dto);
  }

  @Delete(':id/extra-recipients/:rid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un correo externo de la lista' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 404, description: 'Destinatario no encontrado' })
  removeExtraRecipient(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('rid', new ParseUUIDPipe()) rid: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    this.assertOwnsAssociation(req.user, id);
    return this.removeExtraRecipientUseCase.execute(id, rid);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private assertOwnsAssociation(user: JwtPayload, associationId: string): void {
    if (user.associationId !== associationId) {
      throw new ForbiddenException(
        'Solo puedes gestionar los destinatarios de tu propia asociación',
      );
    }
  }
}
