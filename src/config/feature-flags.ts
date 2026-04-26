import { ConfigService } from '@nestjs/config';
import { EMAIL_ENABLED_DEFAULT } from './constants.js';

/**
 * Indica si la funcionalidad de envio de correos esta habilitada.
 * Controlado por la variable de entorno `EMAIL_ENABLED` (true/false).
 * Por defecto: deshabilitado.
 */
export function isEmailEnabled(config: ConfigService): boolean {
  const raw = config.get<string>('EMAIL_ENABLED');
  if (raw === undefined || raw === null || raw === '') {
    return EMAIL_ENABLED_DEFAULT;
  }
  return raw.toLowerCase() === 'true' || raw === '1';
}
