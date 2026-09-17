const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toLocalDate(date: Date): string {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
}

export function parseLocalDate(value: string): Date {
  const match = LOCAL_DATE_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid local date: ${value}`);
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);

  if (toLocalDate(date) !== value) {
    throw new Error(`Invalid local date: ${value}`);
  }

  return date;
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

export function differenceInCalendarDays(later: string, earlier: string): number {
  const laterDate = parseLocalDate(later);
  const earlierDate = parseLocalDate(earlier);
  return Math.round(
    (Date.UTC(laterDate.getFullYear(), laterDate.getMonth(), laterDate.getDate()) -
      Date.UTC(earlierDate.getFullYear(), earlierDate.getMonth(), earlierDate.getDate())) /
      86_400_000,
  );
}

export function getWeekRange(value: string): { start: string; end: string } {
  const date = parseLocalDate(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  const start = addCalendarDays(value, -mondayOffset);
  return { start, end: addCalendarDays(start, 6) };
}

export function getMonthRange(month: string): { start: string; end: string; days: number } {
  const date = parseLocalDate(`${month}-01`);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1, 12);
  const end = addCalendarDays(toLocalDate(nextMonth), -1);
  return { start: `${month}-01`, end, days: parseLocalDate(end).getDate() };
}

export function enumerateLocalDates(start: string, end: string): string[] {
  const dates: string[] = [];

  for (let date = start; date <= end; date = addCalendarDays(date, 1)) {
    dates.push(date);
  }

  return dates;
}

export function getLocalDayIsoRange(localDate: string): { start: string; end: string } {
  const start = parseLocalDate(localDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
