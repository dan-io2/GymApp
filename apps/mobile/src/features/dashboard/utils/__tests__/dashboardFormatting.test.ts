import {
  formatCalories,
  formatCaloriesWithUnit,
  formatActivityLabel,
  formatGoalLabel,
  formatMacroGrams,
  formatMacroGramsWithUnit,
  formatOunces,
  formatProgressStatus,
  formatWeeklyRate,
  formatWeight,
  getClampedProgressRatio,
  getMacroCalorieShare,
} from '../dashboardFormatting';

describe('dashboardFormatting', () => {
  it('maps lose, maintain, and gain labels for users', () => {
    expect(formatGoalLabel('lose')).toBe('Lose Weight');
    expect(formatGoalLabel('maintain')).toBe('Maintain Weight');
    expect(formatGoalLabel('gain')).toBe('Gain Weight / Muscle');
  });

  it('formats imperial target weight in pounds', () => {
    expect(formatWeight(86.18, 'imperial')).toBe('190 lb');
  });

  it('formats metric target weight in kilograms', () => {
    expect(formatWeight(75, 'metric')).toBe('75 kg');
  });

  it('formats weekly rate signs according to goal direction', () => {
    expect(formatWeeklyRate(0.25, 'lose', 'metric')).toBe('-0.3 kg/week');
    expect(formatWeeklyRate(0.23, 'gain', 'imperial')).toBe('+0.5 lb/week');
    expect(formatWeeklyRate(null, 'maintain', 'imperial')).toBeNull();
  });

  it('maps activity labels without exposing database strings', () => {
    expect(formatActivityLabel('very_active')).toBe('Very Active');
  });

  it('calculates macro calorie share as target composition', () => {
    expect(getMacroCalorieShare(210, 4, 2284)).toBe(37);
    expect(getMacroCalorieShare(190, 4, 2284)).toBe(33);
    expect(getMacroCalorieShare(76, 9, 2284)).toBe(30);
  });

  it('formats calories as whole kcal display values', () => {
    expect(formatCalories(2494.45)).toBe('2,494');
    expect(formatCaloriesWithUnit(2133)).toBe('2,133 kcal');
  });

  it('formats macro grams without unnecessary trailing decimals', () => {
    expect(formatMacroGrams(96.3)).toBe('96.3');
    expect(formatMacroGramsWithUnit(20)).toBe('20 g');
    expect(formatMacroGramsWithUnit(20.0)).toBe('20 g');
  });

  it('formats ounce values with bounded precision', () => {
    expect(formatOunces(1.12877)).toBe('1.13 oz');
  });

  it('formats progress status without negative remaining wording', () => {
    expect(formatProgressStatus({ overage: 0, remaining: 493, unit: 'kcal' })).toBe(
      '493 kcal remaining',
    );
    expect(formatProgressStatus({ overage: 361.4, remaining: 0, unit: 'kcal' })).toBe(
      '361 kcal over target',
    );
    expect(formatProgressStatus({ overage: 118.2, remaining: 0, unit: 'g' })).toBe(
      '118.2 g over target',
    );
    expect(formatProgressStatus({ overage: 0, remaining: 0, unit: 'g' })).toBe('Target reached');
  });

  it('clamps visual progress while preserving actual overage elsewhere', () => {
    expect(getClampedProgressRatio(1.66)).toBe(1);
    expect(getClampedProgressRatio(-0.2)).toBe(0);
    expect(getClampedProgressRatio(Number.NaN)).toBe(0);
  });
});
