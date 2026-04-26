/**
 * Cuenta dias inclusive entre dos fechas YYYY-MM-DD.
 */
export function countDaysInclusive(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86_400_000) + 1;
}

/**
 * Cuenta dias transcurridos dentro de un periodo hasta `today` (inclusive).
 * - Si today < startDate -> 0 (periodo futuro).
 * - Si today > endDate   -> dias totales del periodo (periodo pasado).
 * - Caso contrario       -> dias desde startDate hasta today inclusive.
 * Las fechas se interpretan como YYYY-MM-DD en UTC para evitar desfase horario.
 */
export function countDaysElapsedInPeriod(
  startDate: string,
  endDate: string,
  today: string,
): number {
  if (today < startDate) return 0;
  if (today > endDate) return countDaysInclusive(startDate, endDate);
  return countDaysInclusive(startDate, today);
}
