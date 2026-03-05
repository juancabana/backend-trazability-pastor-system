export interface Period {
  start: Date;
  end: Date;
}

export function getCurrentPeriod(
  deadlineDay: number,
  referenceDate?: Date,
): Period {
  const today = referenceDate || new Date();
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d > today) return false;

  return isDateInCurrentPeriod(date, deadlineDay);
}
