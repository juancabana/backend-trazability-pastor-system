import { BadRequestException, Injectable } from '@nestjs/common';
import { UserRepository } from '../../../auth/infrastructure/repositories/user.repository.js';
import { ExtraRecipientRepository } from '../../../association/infrastructure/repositories/extra-recipient.repository.js';
import { EmailService } from '../../../email/email.service.js';
import { ExcelGeneratorService } from '../../../email/excel-generator.service.js';
import { GetAssociationForEmailUseCase } from './get-association-for-email.use-case.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';
import { COMPLIANCE_THRESHOLD } from '../../../config/constants.js';
import type {
  SendConsolidatedReportDto,
  SendConsolidatedReportResponseDto,
} from '../../presentation/dtos/send-consolidated-report.dto.js';

@Injectable()
export class SendConsolidatedReportUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly extraRecipientRepo: ExtraRecipientRepository,
    private readonly emailService: EmailService,
    private readonly excelGenerator: ExcelGeneratorService,
    private readonly getAssociationForEmail: GetAssociationForEmailUseCase,
  ) {}

  async execute(
    dto: SendConsolidatedReportDto,
  ): Promise<SendConsolidatedReportResponseDto> {
    const { associationId } = dto;
    const periodOffset = dto.periodOffset ?? 0;
    const recipientUserIds = dto.recipientUserIds ?? [];
    const extraRecipientIds = dto.extraRecipientIds ?? [];
    const includedPastorIds =
      dto.includedPastorIds && dto.includedPastorIds.length > 0
        ? dto.includedPastorIds
        : undefined; // undefined = todos los pastores

    if (recipientUserIds.length === 0 && extraRecipientIds.length === 0) {
      throw new BadRequestException(
        'Debe seleccionar al menos un destinatario',
      );
    }

    // ── Resolver usuarios del sistema ──────────────────────────────────────
    const userRecipients: { name: string; email: string }[] = [];
    if (recipientUserIds.length > 0) {
      const adminUsers = await this.userRepo.findAdminRecipients(associationId);
      const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

      const invalid = recipientUserIds.filter((id) => !adminMap.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Los siguientes IDs no corresponden a administradores de esta asociación: ${invalid.join(', ')}`,
        );
      }

      const pastorIds = recipientUserIds.filter(
        (id) => adminMap.get(id)?.role === UserRole.PASTOR,
      );
      if (pastorIds.length > 0) {
        throw new BadRequestException(
          'Solo se pueden enviar correos a usuarios con rol administrador',
        );
      }

      for (const id of recipientUserIds) {
        const u = adminMap.get(id)!;
        userRecipients.push({ name: u.name, email: u.email });
      }
    }

    // ── Resolver destinatarios externos ────────────────────────────────────
    const extraRecipients: { name: string; email: string }[] = [];
    if (extraRecipientIds.length > 0) {
      const extras = await this.extraRecipientRepo.findByIds(
        extraRecipientIds,
        associationId,
      );
      if (extras.length !== extraRecipientIds.length) {
        throw new BadRequestException(
          'Algunos destinatarios externos no pertenecen a esta asociación',
        );
      }
      for (const e of extras) {
        extraRecipients.push({ name: e.name, email: e.email });
      }
    }

    const recipients = [...userRecipients, ...extraRecipients];

    // ── Obtener datos consolidados + detalle por pastor (1 round trip DB) ──
    const { consolidated, pastorDetails, period } =
      await this.getAssociationForEmail.execute(
        associationId,
        periodOffset,
        includedPastorIds,
      );

    // ── Generar archivos Excel ─────────────────────────────────────────────
    const periodLabel = period.label;

    const [consolidatedBuffer, ...pastorBuffers] = await Promise.all([
      this.excelGenerator.generateConsolidatedExcel(consolidated, periodLabel),
      ...pastorDetails.map((p) =>
        this.excelGenerator.generatePastorExcel(p, periodLabel),
      ),
    ]);

    const sanitize = (name: string) =>
      name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, '').trim().replace(/\s+/g, '_');

    const attachments = [
      {
        filename: `Consolidado_${sanitize(periodLabel)}.xlsx`,
        content: consolidatedBuffer,
      },
      ...pastorDetails.map((p, i) => ({
        filename: `Pastor_${sanitize(p.pastorName)}_${sanitize(periodLabel)}.xlsx`,
        content: pastorBuffers[i],
      })),
    ];

    // ── Construir resumen para el cuerpo del correo ────────────────────────
    const totalPastors = consolidated.pastorSummaries.length;
    const avgCompliance =
      totalPastors > 0
        ? Math.round(
            (consolidated.pastorSummaries.reduce((s, p) => s + p.compliance, 0) /
              totalPastors) *
              100,
          )
        : 0;

    const summary = {
      periodLabel,
      periodStart: period.startDate,
      periodEnd: period.endDate,
      totalPastors,
      totalActivities: consolidated.totals.totalActivities,
      totalHours: consolidated.totals.totalHours.toFixed(1),
      avgCompliance,
      attachmentCount: attachments.length,
      generatedAt: new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Bogota',
      }),
    };

    // ── Enviar correos ─────────────────────────────────────────────────────
    await this.emailService.sendConsolidatedReport(recipients, summary, attachments);

    return {
      sent: recipients.length,
      recipients: recipients.map((r) => r.email),
    };
  }
}
