import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import type { AssociationConsolidatedResponseDto } from '../consolidated/application/dtos/consolidated.response.dto.js';
import { COMPLIANCE_THRESHOLD } from '../config/constants.js';
import { isEmailEnabled } from '../config/feature-flags.js';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export interface EmailRecipient {
  name: string;
  email: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {
    this.enabled = isEmailEnabled(this.config);
    if (!this.enabled) {
      this.logger.warn(
        'EmailService deshabilitado (EMAIL_ENABLED=false). El envio de correos esta apagado.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendConsolidatedReport(
    recipients: EmailRecipient[],
    data: AssociationConsolidatedResponseDto,
    month: number,
    year: number,
  ): Promise<void> {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'El envio de correos esta deshabilitado. Configurar EMAIL_ENABLED=true y las variables MAIL_* para activarlo.',
      );
    }

    const monthLabel = MONTHS_ES[month - 1] ?? String(month);
    const subject = `Consolidado Pastoral – ${monthLabel} ${year}`;

    const totalActivities = data.totals?.totalActivities ?? 0;
    const totalHours = data.totals?.totalHours ?? 0;
    const totalPastors = data.pastorSummaries?.length ?? 0;

    const avgCompliance =
      totalPastors > 0
        ? Math.round(
            (data.pastorSummaries.reduce((s, p) => s + p.compliance, 0) /
              totalPastors) *
              100,
          )
        : 0;

    const pastorRows = (data.pastorSummaries ?? []).map((p) => ({
      name: p.pastorName,
      district: p.districtName ?? '—',
      position: p.position ?? '',
      activities: p.totalActivities,
      hours: p.totalHours.toFixed(1),
      compliance: Math.round(p.compliance * 100),
      complianceOk: p.compliance >= COMPLIANCE_THRESHOLD,
    }));

    const categoryRows = (data.categories ?? [])
      .map((cat) => {
        const totalQty = (cat.subcategories ?? []).reduce(
          (s, sub) => s + sub.totalQuantity,
          0,
        );
        if (totalQty === 0) return null;
        return {
          name: cat.categoryName,
          color: cat.color,
          subcategories: (cat.subcategories ?? [])
            .filter((sub) => sub.totalQuantity > 0)
            .map((sub) => ({
              name: sub.subcategoryName,
              unit: sub.unit,
              quantity: sub.totalQuantity,
              hours: sub.totalHours > 0 ? sub.totalHours.toFixed(1) : null,
            })),
        };
      })
      .filter(Boolean);

    const context = {
      monthLabel,
      year,
      totalPastors,
      totalActivities,
      totalHours: totalHours.toFixed(1),
      avgCompliance,
      pastorRows,
      categoryRows,
      generatedAt: new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Bogota',
      }),
    };

    const sendPromises = recipients.map((r) =>
      this.mailerService
        .sendMail({
          to: r.email,
          subject,
          template: 'consolidated-report',
          context: { ...context, recipientName: r.name },
        })
        .catch((err: unknown) => {
          this.logger.error(`Error enviando a ${r.email}: ${String(err)}`);
          throw err;
        }),
    );

    await Promise.all(sendPromises);
    this.logger.log(
      `Reporte consolidado ${monthLabel} ${year} enviado a ${recipients.length} destinatarios`,
    );
  }
}
