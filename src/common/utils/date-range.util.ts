import { BadRequestException } from '@nestjs/common';
import { YEAR_MIN, YEAR_MAX } from '../../config/constants.js';

export function parseMonth(month: string): number {
  const m = parseInt(month);
  if (isNaN(m) || m < 1 || m > 12) {
    throw new BadRequestException('month debe ser un numero entre 1 y 12');
  }
  return m;
}

export function parseYear(year: string): number {
  const y = parseInt(year);
  if (isNaN(y) || y < YEAR_MIN || y > YEAR_MAX) {
    throw new BadRequestException('year debe ser un numero valido');
  }
  return y;
}

export function validateMonthYear(
  month: string,
  year: string,
): { m: number; y: number } {
  return { m: parseMonth(month), y: parseYear(year) };
}

export function formatMonthRange(
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const mm = String(month).padStart(2, '0');
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const dd = String(lastDayOfMonth).padStart(2, '0');
  return {
    startDate: `${year}-${mm}-01`,
    endDate: `${year}-${mm}-${dd}`,
  };
}
