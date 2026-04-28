import { UserRole } from '../common/enums/user-role.enum.js';

export const BCRYPT_ROUNDS = 12;

export const JWT_EXPIRY = '7d';

export const THROTTLE_TTL = 60_000;
export const THROTTLE_LIMIT = 30;
export const THROTTLE_LOGIN_TTL = 60_000;
export const THROTTLE_LOGIN_LIMIT = 5;

export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.PASTOR]: 0,
  [UserRole.ADMIN_READONLY]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
  [UserRole.OWNER]: 4,
};

// ===== Reglas de negocio =====
// Zona horaria oficial del sistema. Toda logica de fechas usa esta zona.
export const BUSINESS_TIMEZONE = 'America/Bogota';

// Umbrales de cumplimiento (decimales 0-1).
// >= COMPLIANCE_THRESHOLD: verde
// >= COMPLIANCE_AMBER_THRESHOLD y < COMPLIANCE_THRESHOLD: ambar
// < COMPLIANCE_AMBER_THRESHOLD: rojo
export const COMPLIANCE_THRESHOLD = 0.7;
export const COMPLIANCE_AMBER_THRESHOLD = 0.4;

// Dia limite de reporte por defecto y maximo permitido.
// Maximo 27: el inicio del periodo es deadlineDay + 1, y el dia 28 existe
// en todos los meses (incluido febrero). Con 28 el inicio seria el 29, que
// no existe en febrero de anos no bisiestos y causaria desbordamiento de fecha.
export const DEFAULT_REPORT_DEADLINE_DAY = 20;
export const MAX_REPORT_DEADLINE_DAY = 27;
export const MIN_REPORT_DEADLINE_DAY = 1;

// Rango de anios validos para filtros y queries.
export const YEAR_MIN = 2000;
export const YEAR_MAX = 2100;

// Feature flags. Valores por defecto seguros (deshabilitados) cuando la
// integracion externa requerida aun no esta configurada.
export const EMAIL_ENABLED_DEFAULT = false;
