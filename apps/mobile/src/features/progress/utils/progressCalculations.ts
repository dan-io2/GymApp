import { kgToLb } from '@gymapp/nutrition';

import type {
  CalendarDayState,
  ConsistencySummary,
  DiaryDaySummary,
  MonthlyRecap,
  UnitSystem,
  WeightCheckIn,
  WeightTrendPoint,
  WeightTrendRange,
} from '../types/progressTypes';
import {
  addCalendarDays,
  differenceInCalendarDays,
  enumerateLocalDates,
  getMonthRange,
  getWeekRange,
} from './localDate';

export function sortCheckIns(checkIns: WeightCheckIn[]): WeightCheckIn[] {
  return [...checkIns].sort((a, b) => a.localDate.localeCompare(b.localDate));
}

export function getWeightSummary(checkIns: WeightCheckIn[], today: string) {
  const history = sortCheckIns(checkIns);
  const latestCheckIn = history.at(-1) ?? null;
  const previousCheckIn = history.at(-2) ?? null;
  const week = getWeekRange(today);

  return {
    history,
    latestCheckIn,
    previousCheckIn,
    changeKg:
      latestCheckIn && previousCheckIn
        ? round(latestCheckIn.weightKg - previousCheckIn.weightKg, 2)
        : null,
    checkedInThisWeek: history.some(
      (checkIn) => checkIn.localDate >= week.start && checkIn.localDate <= week.end,
    ),
    daysSinceLastCheckIn: latestCheckIn
      ? Math.max(0, differenceInCalendarDays(today, latestCheckIn.localDate))
      : null,
  };
}

export function createWeightTrend(
  checkIns: WeightCheckIn[],
  range: WeightTrendRange,
  today: string,
  unitSystem: UnitSystem,
): WeightTrendPoint[] {
  const rangeDays: Record<Exclude<WeightTrendRange, 'all'>, number> = {
    '1m': 31,
    '3m': 92,
    '6m': 183,
    '1y': 366,
  };
  const start = range === 'all' ? null : addCalendarDays(today, -(rangeDays[range] - 1));

  return sortCheckIns(checkIns)
    .filter((checkIn) => !start || checkIn.localDate >= start)
    .map((checkIn) => ({
      date: checkIn.localDate,
      weightKg: checkIn.weightKg,
      displayWeight: round(
        unitSystem === 'imperial' ? kgToLb(checkIn.weightKg) : checkIn.weightKg,
        1,
      ),
      displayUnit: unitSystem === 'imperial' ? 'lb' : 'kg',
    }));
}

export function aggregateDiaryDays(
  rows: {
    localDate: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[],
): DiaryDaySummary[] {
  const days = new Map<string, DiaryDaySummary>();

  for (const row of rows) {
    const current = days.get(row.localDate) ?? {
      date: row.localDate,
      entryCount: 0,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    };
    current.entryCount += 1;
    current.calories += row.calories;
    current.proteinG += row.proteinG;
    current.carbsG += row.carbsG;
    current.fatG += row.fatG;
    days.set(row.localDate, current);
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateCurrentStreak(trackedDates: Iterable<string>, today: string): number {
  const tracked = new Set(trackedDates);
  const start = tracked.has(today) ? today : addCalendarDays(today, -1);

  if (!tracked.has(start)) {
    return 0;
  }

  let streak = 0;
  for (let date = start; tracked.has(date); date = addCalendarDays(date, -1)) {
    streak += 1;
  }
  return streak;
}

export function calculateLongestStreak(trackedDates: Iterable<string>): number {
  const dates = [...new Set(trackedDates)].sort();
  let longest = 0;
  let current = 0;
  let previous: string | null = null;

  for (const date of dates) {
    current = previous && differenceInCalendarDays(date, previous) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  }

  return longest;
}

export function getEligibleDays(month: string, today: string): number {
  const range = getMonthRange(month);
  if (month === today.slice(0, 7)) {
    return Math.min(range.days, Number(today.slice(8, 10)));
  }
  if (month > today.slice(0, 7)) {
    return 0;
  }
  return range.days;
}

export function buildConsistencySummary(
  diaryDays: DiaryDaySummary[],
  today: string,
): ConsistencySummary {
  const trackedDates = diaryDays.map((day) => day.date).filter((date) => date <= today);
  const month = today.slice(0, 7);
  const eligibleDays = getEligibleDays(month, today);
  const monthTracked = trackedDates.filter((date) => date.startsWith(month)).length;

  return {
    currentStreak: calculateCurrentStreak(trackedDates, today),
    longestStreak: calculateLongestStreak(trackedDates),
    monthlyConsistencyPercentage: percentage(monthTracked, eligibleDays),
    monthlyEligibleDays: eligibleDays,
    monthlyTrackedDays: monthTracked,
    totalTrackedDays: new Set(trackedDates).size,
  };
}

export function buildCalendarMonth(
  month: string,
  diaryDays: DiaryDaySummary[],
  today: string,
): CalendarDayState[] {
  const range = getMonthRange(month);
  const byDate = new Map(diaryDays.map((day) => [day.date, day]));

  return enumerateLocalDates(range.start, range.end).map((date) => {
    const day = byDate.get(date);
    const state = date > today ? 'future' : day ? 'tracked' : 'untracked';
    return {
      date,
      state,
      tracked: state === 'tracked',
      entryCount: day?.entryCount ?? 0,
      calories: day ? round(day.calories, 1) : null,
    };
  });
}

export function buildCalendarYear(
  year: number,
  diaryDays: DiaryDaySummary[],
  today: string,
): CalendarDayState[] {
  const days: CalendarDayState[] = [];
  for (let month = 1; month <= 12; month += 1) {
    days.push(
      ...buildCalendarMonth(`${year}-${month.toString().padStart(2, '0')}`, diaryDays, today),
    );
  }
  return days;
}

export function buildMonthlyRecap(
  month: string,
  diaryDays: DiaryDaySummary[],
  checkIns: WeightCheckIn[],
  today: string,
): MonthlyRecap {
  const eligibleDays = getEligibleDays(month, today);
  const relevantDays = diaryDays.filter((day) => day.date.startsWith(month) && day.date <= today);
  const relevantCheckIns = sortCheckIns(checkIns).filter(
    (item) => item.localDate.startsWith(month) && item.localDate <= today,
  );
  const starting = relevantCheckIns.at(0) ?? null;
  const ending = relevantCheckIns.at(-1) ?? null;
  const divisor = relevantDays.length;

  return {
    month,
    trackedDays: relevantDays.length,
    eligibleDays,
    consistencyPercentage: percentage(relevantDays.length, eligibleDays),
    longestStreak: calculateLongestStreak(relevantDays.map((day) => day.date)),
    totalFoodsLogged: relevantDays.reduce((sum, day) => sum + day.entryCount, 0),
    averageCalories: average(
      relevantDays.map((day) => day.calories),
      divisor,
    ),
    averageProteinG: average(
      relevantDays.map((day) => day.proteinG),
      divisor,
    ),
    averageCarbsG: average(
      relevantDays.map((day) => day.carbsG),
      divisor,
    ),
    averageFatG: average(
      relevantDays.map((day) => day.fatG),
      divisor,
    ),
    calorieTargetDays: null,
    proteinTargetDays: null,
    startingWeightKg: starting?.weightKg ?? null,
    endingWeightKg: ending?.weightKg ?? null,
    weightChangeKg:
      starting && ending && starting.id !== ending.id
        ? round(ending.weightKg - starting.weightKg, 2)
        : null,
  };
}

function average(values: number[], divisor: number): number | null {
  return divisor === 0 ? null : round(values.reduce((sum, value) => sum + value, 0) / divisor, 1);
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : round((numerator / denominator) * 100, 1);
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
