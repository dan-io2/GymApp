import {
  ACTIVITY_MULTIPLIERS,
  DEFAULT_CALORIE_TARGET_OPTIONS,
  DEFAULT_MACRO_TARGET_OPTIONS,
} from './constants';
import { NutritionCalculationError } from './errors';
import type {
  ActivityLevel,
  BmrInput,
  CalorieTargetOptions,
  GoalType,
  MacroTargetInput,
  MacroTargets,
  NutritionPlan,
  NutritionPlanInput,
} from './types';
import {
  assertActivityLevel,
  assertGoalType,
  assertPositiveFinite,
  assertSexForCalculation,
  assertWeeklyRate,
} from './validation';

export function roundToWhole(value: number): number {
  return Math.round(value);
}

export function lbToKg(pounds: number): number {
  assertPositiveFinite(pounds, 'Pounds', 'INVALID_WEIGHT');
  return pounds * 0.45359237;
}

export function kgToLb(kilograms: number): number {
  assertPositiveFinite(kilograms, 'Kilograms', 'INVALID_WEIGHT');
  return kilograms / 0.45359237;
}

export function inchesToCm(inches: number): number {
  assertPositiveFinite(inches, 'Inches', 'INVALID_HEIGHT');
  return inches * 2.54;
}

export function cmToInches(centimeters: number): number {
  assertPositiveFinite(centimeters, 'Centimeters', 'INVALID_HEIGHT');
  return centimeters / 2.54;
}

export function getActivityMultiplier(activityLevel: ActivityLevel): number {
  assertActivityLevel(activityLevel);
  return ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateBMR({
  sexForCalculation,
  ageYears,
  heightCm,
  weightKg,
}: BmrInput): number {
  assertSexForCalculation(sexForCalculation);
  assertPositiveFinite(ageYears, 'Age', 'INVALID_AGE');
  assertPositiveFinite(heightCm, 'Height', 'INVALID_HEIGHT');
  assertPositiveFinite(weightKg, 'Weight', 'INVALID_WEIGHT');

  // Mifflin-St Jeor equation. Inputs are kilograms, centimeters, and years.
  const baseBmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const sexAdjustment = sexForCalculation === 'male' ? 5 : -161;

  return roundToWhole(baseBmr + sexAdjustment);
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  assertPositiveFinite(bmr, 'BMR', 'INVALID_CALORIE_TARGET');

  return roundToWhole(bmr * getActivityMultiplier(activityLevel));
}

export function calculateCalorieTarget(
  tdee: number,
  goalType: GoalType,
  weeklyRateKg?: number,
  options: CalorieTargetOptions = {},
): number {
  assertPositiveFinite(tdee, 'TDEE', 'INVALID_CALORIE_TARGET');
  assertGoalType(goalType);
  assertWeeklyRate(weeklyRateKg);

  if (goalType === 'maintain') {
    return roundToWhole(tdee);
  }

  const mergedOptions = {
    defaultWeeklyRateKgByGoal: {
      ...DEFAULT_CALORIE_TARGET_OPTIONS.defaultWeeklyRateKgByGoal,
      ...options.defaultWeeklyRateKgByGoal,
    },
    kcalPerKg: options.kcalPerKg ?? DEFAULT_CALORIE_TARGET_OPTIONS.kcalPerKg,
  };

  assertPositiveFinite(
    mergedOptions.kcalPerKg,
    'Kilocalories per kilogram',
    'INVALID_CALORIE_TARGET',
  );

  const rateKg = weeklyRateKg ?? mergedOptions.defaultWeeklyRateKgByGoal[goalType];
  const dailyAdjustment = (rateKg * mergedOptions.kcalPerKg) / 7;
  const targetCalories = goalType === 'lose' ? tdee - dailyAdjustment : tdee + dailyAdjustment;

  if (targetCalories <= 0) {
    throw new NutritionCalculationError(
      'Calorie target must stay greater than zero.',
      'INVALID_CALORIE_TARGET',
    );
  }

  return roundToWhole(targetCalories);
}

export function calculateMacroTargets({
  dailyCalories,
  weightKg,
  options = {},
}: MacroTargetInput): MacroTargets {
  assertPositiveFinite(dailyCalories, 'Daily calories', 'INVALID_CALORIE_TARGET');
  assertPositiveFinite(weightKg, 'Weight', 'INVALID_WEIGHT');

  const proteinGramsPerKg =
    options.proteinGramsPerKg ?? DEFAULT_MACRO_TARGET_OPTIONS.proteinGramsPerKg;
  const fatGramsPerKg = options.fatGramsPerKg ?? DEFAULT_MACRO_TARGET_OPTIONS.fatGramsPerKg;

  assertPositiveFinite(proteinGramsPerKg, 'Protein grams per kilogram', 'INVALID_MACRO_STRATEGY');
  assertPositiveFinite(fatGramsPerKg, 'Fat grams per kilogram', 'INVALID_MACRO_STRATEGY');

  const proteinG = roundToWhole(weightKg * proteinGramsPerKg);
  const fatG = roundToWhole(weightKg * fatGramsPerKg);
  const caloriesReservedForProteinAndFat = proteinG * 4 + fatG * 9;
  const remainingCalories = dailyCalories - caloriesReservedForProteinAndFat;

  if (remainingCalories < 0) {
    throw new NutritionCalculationError(
      'Protein and fat targets exceed the daily calorie target.',
      'MACRO_CALORIES_EXCEED_TARGET',
    );
  }

  return {
    proteinG,
    fatG,
    carbsG: roundToWhole(remainingCalories / 4),
  };
}

export function calculateNutritionPlan(input: NutritionPlanInput): NutritionPlan {
  const bmr = calculateBMR(input);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const dailyCalories = calculateCalorieTarget(
    tdee,
    input.goalType,
    input.weeklyRateKg,
    input.calorieOptions,
  );
  const macros = calculateMacroTargets({
    dailyCalories,
    weightKg: input.weightKg,
    options: input.macroOptions,
  });

  return {
    bmr,
    tdee,
    dailyCalories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
  };
}
