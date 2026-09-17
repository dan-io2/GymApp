import {
  addCalendarDays,
  differenceInCalendarDays,
  getMonthRange,
  getWeekRange,
  parseLocalDate,
  toLocalDate,
} from '../localDate';

describe('local calendar date utilities', () => {
  it('uses Monday through Sunday week semantics', () => {
    expect(getWeekRange('2026-09-15')).toEqual({ start: '2026-09-14', end: '2026-09-20' });
  });

  it('crosses month, year, and leap-day boundaries', () => {
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addCalendarDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(getMonthRange('2024-02').days).toBe(29);
    expect(getMonthRange('2025-02').days).toBe(28);
  });

  it('calculates calendar differences without relying on 24-hour local timestamps', () => {
    expect(differenceInCalendarDays('2026-03-09', '2026-03-07')).toBe(2);
    expect(differenceInCalendarDays('2026-11-02', '2026-10-31')).toBe(2);
  });

  it('round trips a local date at local noon', () => {
    expect(toLocalDate(parseLocalDate('2026-09-15'))).toBe('2026-09-15');
  });
});
