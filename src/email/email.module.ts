import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service.js';
import { isEmailEnabled } from '../config/feature-flags.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Cuando el envio de correos esta deshabilitado, no exigimos las
        // variables MAIL_* (BillionMail u otro proveedor todavia no
        // configurado). Devolvemos una configuracion minima valida; el
        // EmailService valida el flag y omite el envio.
        if (!isEmailEnabled(config)) {
          return {
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.invalid' },
            template: {
              dir: join(__dirname, 'templates'),
              adapter: new HandlebarsAdapter(),
              options: { strict: true },
            },
          };
        }

        return {
          transport: {
            host: config.getOrThrow<string>('MAIL_HOST'),
            port: config.get<number>('MAIL_PORT') ?? 587,
            secure: false,
            auth: {
              user: config.getOrThrow<string>('MAIL_USER'),
              pass: config.getOrThrow<string>('MAIL_PASS'),
            },
          },
          defaults: {
            from: config.getOrThrow<string>('MAIL_FROM'),
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
