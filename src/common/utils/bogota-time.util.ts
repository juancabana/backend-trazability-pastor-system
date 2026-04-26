/**
 * Utilidades de tiempo en zona horaria America/Bogota (UTC-5, sin DST).
 *
 * Toda la logica de negocio que dependa de "hoy", "mes actual" o
 * comparaciones contra el dia limite de reporte debe usar estas funciones
 * para que el comportamiento sea consistente independientemente de la zona
 * horaria del servidor (Vercel corre en UTC).
 *
 * Implementacion sin dependencias externas usando Intl.DateTimeFormat.
 */

export const BOGOTA_TIMEZONE = 'America/Bogota';

export interface BogotaDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
}

/**
 * Devuelve los componentes (year/month/day/hour/minute/second) de una fecha
 * proyectada a la zona horaria de Bogota.
 */
export function getBogotaDateParts(date: Date = new Date()): BogotaDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOGOTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string): number => {
    const part = parts.find((p) => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === 24 ? 0 : get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Devuelve un Date que representa "ahora" cuyos componentes locales
 * (getFullYear, getMonth, getDate, etc.) coinciden con la hora de Bogota.
 *
 * IMPORTANTE: el Date resultante NO es el instante actual real; esta
 * desplazado para que las operaciones tipo getFullYear/getMonth/getDate
 * devuelvan los valores de Bogota. Solo usar para logica que lee componentes
 * locales, no para comparaciones de instante absoluto.
 */
export function nowInBogota(): Date {
  const p = getBogotaDateParts();
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/**
 * Parsea un string YYYY-MM-DD interpretando la fecha como medianoche en
 * Bogota. El Date resultante tiene componentes locales (year/month/day) que
 * coinciden con la fecha logica de Bogota.
 */
export function parseBogotaDate(yyyymmdd: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd);
  if (!match) {
    throw new Error(
      `Fecha invalida, se esperaba formato YYYY-MM-DD: ${yyyymmdd}`,
    );
  }
  const [, y, m, d] = match;
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
}

/**
 * Formatea una fecha como YYYY-MM-DD en zona Bogota.
 */
export function formatBogotaDate(date: Date = new Date()): string {
  const p = getBogotaDateParts(date);
  const mm = String(p.month).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${p.year}-${mm}-${dd}`;
}
