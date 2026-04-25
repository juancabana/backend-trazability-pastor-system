import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { EmailService } from '../../../email/email.service.js';
import { GetConsolidatedByAssociationUseCase } from './get-consolidated-by-association.use-case.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import type {
  SendConsolidatedReportDto,
  SendConsolidatedReportResponseDto,
} from '../../presentation/dtos/send-consolidated-report.dto.js';

@Injectable()
export class SendConsolidatedReportUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailService,
    private readonly getConsolidatedByAssociation: GetConsolidatedByAssociationUseCase,
  ) {}

  async execute(
    dto: SendConsolidatedReportDto,
  ): Promise<SendConsolidatedReportResponseDto> {
    const { recipientUserIds, associationId, month, year } = dto;

    if (recipientUserIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un destinatario');
    }

    // Obtener candidatos admin de la asociación
    const adminUsers = await this.userRepo.findAdminRecipients(associationId);
    const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

    // Validar que todos los IDs solicitados sean admins de esta asociación
    const invalid = recipientUserIds.filter((id) => !adminMap.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Los siguientes IDs no corresponden a administradores de esta asociación: ${invalid.join(', ')}`,
      );
    }

    // Validar que ninguno sea pastor
    const pastorIds = recipientUserIds.filter((id) => {
      const u = adminMap.get(id);
      return u?.role === UserRole.PASTOR;
    });
    if (pastorIds.length > 0) {
      throw new BadRequestException(
        'Solo se pueden enviar correos a usuarios con rol administrador',
      );
    }

    const recipients = recipientUserIds.map((id) => {
      const u = adminMap.get(id)!;
      return { name: u.name, email: u.email };
    });

    // Obtener el consolidado de la asociación
    const consolidated = await this.getConsolidatedByAssociation.execute(
      associationId,
      month,
      year,
    );

    // Enviar correos
    await this.emailService.sendConsolidatedReport(
      recipients,
      consolidated,
      month,
      year,
    );

    return {
      sent: recipients.length,
      recipients: recipients.map((r) => r.email),
    };
  }
}
