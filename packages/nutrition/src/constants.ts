import type { ActivityLevel, CalorieTargetOptions, MacroTargetOptions } from './types';

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
} as const satisfies Record<ActivityLevel, number>;

export const DEFAULT_KCAL_PER_KG = 7700;

export const DEFAULT_CALORIE_TARGET_OPTIONS = {
  defaultWeeklyRateKgByGoal: {
    lose: 0.25,
    gain: 0.25,
  },
  kcalPerKg: DEFAULT_KCAL_PER_KG,
} as const satisfies Required<CalorieTargetOptions>;

export const DEFAULT_MACRO_TARGET_OPTIONS = {
  proteinGramsPerKg: 1.8,
  fatGramsPerKg: 0.8,
} as const satisfies Required<MacroTargetOptions>;
