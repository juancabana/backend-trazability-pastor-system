import { nowInBogota } from './bogota-time.util.js';

export interface Period {
  start: Date;
  end: Date;
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
    const startDate = new Date(year, month - 1, deadlineDay + 1);
    const endDate = new Date(year, month, deadlineDay);
    return { start: startDate, end: endDate };
  } else {
    const startDate = new Date(year, month, deadlineDay + 1);
    const endDate = new Date(year, month + 1, deadlineDay);
    return { start: startDate, end: endDate };
  }
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
