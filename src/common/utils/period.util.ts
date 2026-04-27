import { BadRequestException } from '@nestjs/common';
import { formatBogotaDate, nowInBogota } from './bogota-time.util.js';

export interface Period {
  start: Date;
  end: Date;
}

export interface PeriodMeta {
  /** Fecha de inicio del periodo en formato YYYY-MM-DD (Bogota). */
  startDate: string;
  /** Fecha de fin del periodo en formato YYYY-MM-DD (Bogota). */
  endDate: string;
  /** Etiqueta legible. Ej: "20 feb 2026 - 19 mar 2026". */
  label: string;
  /** Dia de cierre usado para calcular el periodo. */
  deadlineDay: number;
  /** Offset usado: 0 = actual, -1 = anterior, +1 = siguiente. */
  offset: number;
}

const MONTHS_ES_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/**
 * Construye un Date clampeando el dia al ultimo dia valido del mes.
 * Necesario porque `deadlineDay + 1` puede ser 29 cuando deadlineDay = 28,
 * y febrero en anos no bisiestos solo tiene 28 dias; sin este helper
 * `new Date(year, 1, 29)` desbordaria a 1 de marzo.
 */
function safeDate(year: number, month: number, day: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDayOfMonth));
}

/**
 * Calcula el periodo de reporte vigente en zona horaria Bogota.
 * El periodo va desde el dia (deadlineDay + 1) del mes anterior hasta el
 * dia deadlineDay del mes actual (o del proximo mes si ya se paso).
 */
export function getCurrentPeriod(
  deadlineDay: number,
  referenceDate?: Date,
): Period {
  const today = referenceDate ?? nowInBogota();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  if (day <= deadlineDay) {
    const startDate = safeDate(year, month - 1, deadlineDay + 1);
    const endDate = safeDate(year, month, deadlineDay);
    return { start: startDate, end: endDate };
  } else {
    const startDate = safeDate(year, month, deadlineDay + 1);
    const endDate = safeDate(year, month + 1, deadlineDay);
    return { start: startDate, end: endDate };
  }
}

/**
 * Calcula el periodo desplazado N posiciones respecto al actual.
 * offset = 0 → periodo actual
 * offset = -1 → periodo anterior
 * offset = +1 → siguiente periodo (a futuro)
 *
 * Cada periodo cubre exactamente un mes calendario corrido entre dos
 * dias `deadlineDay` consecutivos.
 */
export function getPeriodAtOffset(
  deadlineDay: number,
  offset: number,
  referenceDate?: Date,
): Period {
  const current = getCurrentPeriod(deadlineDay, referenceDate);
  if (offset === 0) return current;

  // Avanzamos/retrocedemos `offset` meses sobre las fechas de inicio y fin.
  // Se usa safeDate para evitar desbordamiento (e.g. dia 29 en febrero no bisiesto).
  const start = safeDate(
    current.start.getFullYear(),
    current.start.getMonth() + offset,
    current.start.getDate(),
  );
  const end = safeDate(
    current.end.getFullYear(),
    current.end.getMonth() + offset,
    current.end.getDate(),
  );
  return { start, end };
}

export function isDateInCurrentPeriod(
  date: Date,
  deadlineDay: number,
): boolean {
  const period = getCurrentPeriod(deadlineDay);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d >= period.start && d <= period.end;
}

export function isDateEditable(date: Date, deadlineDay: number): boolean {
  const now = nowInBogota();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d > today) return false;

  return isDateInCurrentPeriod(date, deadlineDay);
}

/**
 * Formatea un periodo como rango legible. Ej: "20 feb 2026 - 19 mar 2026".
 * Si ambos extremos caen en el mismo año, se omite el año del primero.
 */
export function formatPeriodLabel(period: Period): string {
  const sY = period.start.getFullYear();
  const eY = period.end.getFullYear();
  const sM = MONTHS_ES_SHORT[period.start.getMonth()];
  const eM = MONTHS_ES_SHORT[period.end.getMonth()];
  const sD = period.start.getDate();
  const eD = period.end.getDate();

  if (sY === eY) {
    return `${sD} ${sM} - ${eD} ${eM} ${eY}`;
  }
  return `${sD} ${sM} ${sY} - ${eD} ${eM} ${eY}`;
}

/**
 * Construye un PeriodMeta listo para serializar en respuestas DTO.
 */
export function buildPeriodMeta(
  deadlineDay: number,
  offset: number,
  referenceDate?: Date,
): PeriodMeta {
  const period = getPeriodAtOffset(deadlineDay, offset, referenceDate);
  return {
    startDate: formatBogotaDate(period.start),
    endDate: formatBogotaDate(period.end),
    label: formatPeriodLabel(period),
    deadlineDay,
    offset,
  };
}

/**
 * Parsea y valida el query param `periodOffset`. Default: 0.
 */
export function parsePeriodOffset(raw: string | undefined): number {
  if (raw === undefined || raw === null || raw === '') return 0;
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < -120 || n > 12) {
    throw new BadRequestException(
      'periodOffset debe ser un entero entre -120 y 12',
    );
  }
  return n;
}
