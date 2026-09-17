import { lbToKg } from '@gymapp/nutrition';

import type { DiaryDaySummary, WeightCheckIn } from '../../types/progressTypes';
import {
  aggregateDiaryDays,
  buildCalendarMonth,
  buildCalendarYear,
  buildConsistencySummary,
  buildMonthlyRecap,
  calculateCurrentStreak,
  calculateLongestStreak,
  createWeightTrend,
  getEligibleDays,
  getWeightSummary,
} from '../progressCalculations';

describe('progress calculations', () => {
  it('sorts history and returns latest, previous, change, week status, and days since', () => {
    const summary = getWeightSummary(
      [checkIn('b', '2026-09-15', 94), checkIn('a', '2026-09-08', 95)],
      '2026-09-16',
    );
    expect(summary.history.map((item) => item.id)).toEqual(['a', 'b']);
    expect(summary.latestCheckIn?.id).toBe('b');
    expect(summary.previousCheckIn?.id).toBe('a');
    expect(summary.changeKg).toBe(-1);
    expect(summary.checkedInThisWeek).toBe(true);
    expect(summary.daysSinceLastCheckIn).toBe(1);
  });

  it('integrates canonical kg storage with lb display without mutating history', () => {
    const storedKg = lbToKg(210.4);
    const history = [checkIn('a', '2026-09-15', storedKg)];
    const point = createWeightTrend(history, '1m', '2026-09-15', 'imperial')[0];
    expect(point.displayWeight).toBeCloseTo(210.4, 1);
    expect(point.weightKg).toBe(storedKg);
    expect(history[0].weightKg).toBe(storedKg);
  });

  it('filters graph-ready ranges and keeps all-time history chronological', () => {
    const history = [checkIn('old', '2026-01-01', 100), checkIn('recent', '2026-09-01', 95)];
    expect(createWeightTrend(history, '1m', '2026-09-15', 'metric').map((p) => p.date)).toEqual([
      '2026-09-01',
    ]);
    expect(createWeightTrend(history, 'all', '2026-09-15', 'metric')).toHaveLength(2);
  });

  it.each([
    [['2026-09-15'], '2026-09-15', 1],
    [['2026-09-12', '2026-09-13', '2026-09-14'], '2026-09-15', 3],
    [['2026-09-11', '2026-09-13', '2026-09-14'], '2026-09-15', 2],
    [['2026-09-12', '2026-09-13'], '2026-09-15', 0],
  ])('calculates current streak for %j', (dates, today, expected) => {
    expect(calculateCurrentStreak(dates, today)).toBe(expected);
  });

  it('calculates longest streak across month, year, and leap-day boundaries', () => {
    expect(calculateLongestStreak(['2024-02-28', '2024-02-29', '2024-03-01'])).toBe(3);
    expect(calculateLongestStreak(['2026-12-31', '2027-01-01', '2027-01-02'])).toBe(3);
  });

  it('keeps the active streak across month and year boundaries', () => {
    expect(calculateCurrentStreak(['2026-08-31', '2026-09-01'], '2026-09-02')).toBe(2);
    expect(calculateCurrentStreak(['2026-12-31', '2027-01-01'], '2027-01-01')).toBe(2);
  });

  it('counts multiple foods on one day as one tracked day', () => {
    const days = aggregateDiaryDays([
      diaryRow('2026-09-15', 100),
      diaryRow('2026-09-15', 200),
      diaryRow('2026-09-14', 300),
    ]);
    expect(days).toHaveLength(2);
    expect(days[1]).toMatchObject({ date: '2026-09-15', entryCount: 2, calories: 300 });
  });

  it('uses elapsed days for the current month and full days for historical months', () => {
    expect(getEligibleDays('2026-09', '2026-09-15')).toBe(15);
    expect(getEligibleDays('2026-08', '2026-09-15')).toBe(31);
    expect(getEligibleDays('2025-02', '2026-09-15')).toBe(28);
    expect(getEligibleDays('2024-02', '2026-09-15')).toBe(29);
    expect(getEligibleDays('2026-10', '2026-09-15')).toBe(0);
  });

  it('calculates zero, partial, and full current-month consistency', () => {
    expect(buildConsistencySummary([], '2026-09-02').monthlyConsistencyPercentage).toBe(0);
    expect(
      buildConsistencySummary([day('2026-09-01')], '2026-09-02').monthlyConsistencyPercentage,
    ).toBe(50);
    expect(
      buildConsistencySummary([day('2026-09-01'), day('2026-09-02')], '2026-09-02')
        .monthlyConsistencyPercentage,
    ).toBe(100);
  });

  it('excludes future diary dates from all consistency metrics', () => {
    const summary = buildConsistencySummary(
      [day('2026-09-01'), day('2026-09-16'), day('2026-09-17')],
      '2026-09-15',
    );
    expect(summary).toMatchObject({
      longestStreak: 1,
      monthlyTrackedDays: 1,
      totalTrackedDays: 1,
    });
  });

  it('builds semantic calendar states without presentation colors', () => {
    const calendar = buildCalendarMonth('2026-09', [day('2026-09-01')], '2026-09-02');
    expect(calendar[0].state).toBe('tracked');
    expect(calendar[1].state).toBe('untracked');
    expect(calendar[2].state).toBe('future');
  });

  it('builds efficient leap-year calendar-ready data in one domain pass', () => {
    const year = buildCalendarYear(2024, [day('2024-02-29')], '2024-12-31');
    expect(year).toHaveLength(366);
    expect(year.find((item) => item.date === '2024-02-29')?.tracked).toBe(true);
  });

  it('builds deterministic recap facts and leaves unavailable target adherence null', () => {
    const recap = buildMonthlyRecap(
      '2026-09',
      [day('2026-09-01', 1, 2000, 150, 200, 60), day('2026-09-02', 2, 2200, 170, 210, 70)],
      [checkIn('start', '2026-09-01', 95), checkIn('end', '2026-09-15', 93.5)],
      '2026-09-15',
    );
    expect(recap).toMatchObject({
      trackedDays: 2,
      eligibleDays: 15,
      consistencyPercentage: 13.3,
      longestStreak: 2,
      totalFoodsLogged: 3,
      averageCalories: 2100,
      averageProteinG: 160,
      startingWeightKg: 95,
      endingWeightKg: 93.5,
      weightChangeKg: -1.5,
      calorieTargetDays: null,
      proteinTargetDays: null,
    });
  });

  it('does not invent weight change from a single check-in', () => {
    expect(
      buildMonthlyRecap('2026-09', [], [checkIn('only', '2026-09-01', 95)], '2026-09-15')
        .weightChangeKg,
    ).toBeNull();
  });

  it('excludes future check-ins from the current-month recap', () => {
    const recap = buildMonthlyRecap(
      '2026-09',
      [],
      [checkIn('current', '2026-09-15', 95), checkIn('future', '2026-09-20', 90)],
      '2026-09-15',
    );
    expect(recap.startingWeightKg).toBe(95);
    expect(recap.endingWeightKg).toBe(95);
    expect(recap.weightChangeKg).toBeNull();
  });
});

function checkIn(id: string, localDate: string, weightKg: number): WeightCheckIn {
  return {
    id,
    localDate,
    weightKg,
    userId: 'user',
    recordedAt: `${localDate}T12:00:00Z`,
    createdAt: '',
    updatedAt: '',
  };
}

function day(
  date: string,
  entryCount = 1,
  calories = 100,
  proteinG = 10,
  carbsG = 10,
  fatG = 2,
): DiaryDaySummary {
  return { date, entryCount, calories, proteinG, carbsG, fatG };
}

function diaryRow(localDate: string, calories: number) {
  return { localDate, calories, proteinG: 1, carbsG: 1, fatG: 1 };
}
