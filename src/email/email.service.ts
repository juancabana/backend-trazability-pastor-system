import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { compile, type TemplateDelegate } from 'handlebars';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'path';
import { isEmailEnabled } from '../config/feature-flags.js';

const DEFAULT_LOGO_PATH = '/iasd-logo-ligth.png';

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface ConsolidatedReportSummary {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totalPastors: number;
  totalActivities: number;
  totalHours: string;
  avgCompliance: number;
  attachmentCount: number;
  generatedAt: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly enabled: boolean;
  private readonly resend: Resend | null = null;
  private readonly from: string = '';
  private readonly templateFn: TemplateDelegate<object> | null = null;
  private readonly logoUrl: string = '';

  constructor(private readonly config: ConfigService) {
    this.enabled = isEmailEnabled(this.config);

    if (!this.enabled) {
      this.logger.warn(
        'EmailService deshabilitado (EMAIL_ENABLED=false). El envio de correos esta apagado.',
      );
      return;
    }

    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = this.config.getOrThrow<string>('MAIL_FROM');

    const candidates = [
      join(__dirname, 'templates', 'consolidated-report.hbs'),
      join(
        process.cwd(),
        'src',
        'email',
        'templates',
        'consolidated-report.hbs',
      ),
    ];
    const templatePath = candidates.find(existsSync);
    if (!templatePath) {
      throw new Error(
        `Template consolidated-report.hbs no encontrado. Rutas revisadas:\n${candidates.join('\n')}`,
      );
    }
    this.templateFn = compile(readFileSync(templatePath, 'utf-8'));

    const explicitLogoUrl = this.config.get<string>('EMAIL_LOGO_URL');
    if (explicitLogoUrl && /^https?:\/\//i.test(explicitLogoUrl)) {
      this.logoUrl = explicitLogoUrl;
    } else {
      const frontendUrlRaw = this.config.get<string>('FRONTEND_URL') ?? '';
      const firstFrontendUrl = frontendUrlRaw.split(',')[0]?.trim() ?? '';
      if (/^https?:\/\//i.test(firstFrontendUrl)) {
        this.logoUrl = `${firstFrontendUrl.replace(/\/$/, '')}${DEFAULT_LOGO_PATH}`;
      } else {
        this.logger.warn(
          'No se pudo construir la URL del logo (define EMAIL_LOGO_URL o FRONTEND_URL absoluta).',
        );
      }
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendConsolidatedReport(
    recipients: EmailRecipient[],
    summary: ConsolidatedReportSummary,
    attachments: EmailAttachment[],
  ): Promise<void> {
    if (!this.enabled || !this.resend || !this.templateFn) {
      throw new ServiceUnavailableException(
        'El envio de correos esta deshabilitado. Configurar EMAIL_ENABLED=true y las variables RESEND_API_KEY y MAIL_FROM para activarlo.',
      );
    }

    const subject = `Consolidado Pastoral – ${summary.periodLabel}`;

    for (const recipient of recipients) {
      const html = this.templateFn({
        ...summary,
        recipientName: recipient.name,
        logoUrl: this.logoUrl,
      });

      const { error } = await this.resend.emails.send({
        from: this.from,
        to: recipient.email,
        subject,
        html,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      });

      if (error) {
        this.logger.error(
          `Error enviando a ${recipient.email}: ${error.message}`,
        );
        throw new Error(
          `Resend error para ${recipient.email}: ${error.message}`,
        );
      }

      this.logger.log(`Correo enviado a ${recipient.email}`);
    }

    this.logger.log(
      `Reporte consolidado ${summary.periodLabel} enviado a ${recipients.length} destinatario(s) con ${attachments.length} adjunto(s)`,
    );
  }
}
