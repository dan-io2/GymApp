import { kgToLb } from '@gymapp/nutrition';
import type { ActivityLevel, GoalType } from '@gymapp/nutrition';

import type { ActiveNutritionGoal, UnitSystem } from '../types/dashboardTypes';

export function formatCalories(calories: number): string {
  return Math.round(calories).toLocaleString('en-US');
}

export function formatGramTarget(grams: number): string {
  return `${formatMacroGrams(grams)} g`;
}

export function formatCaloriesWithUnit(calories: number): string {
  return `${formatCalories(calories)} kcal`;
}

export function formatMacroGrams(grams: number): string {
  return formatDecimal(grams);
}

export function formatMacroGramsWithUnit(grams: number): string {
  return `${formatMacroGrams(grams)} g`;
}

export function formatOunces(ounces: number): string {
  return `${formatDecimal(ounces, 2)} oz`;
}

export function formatProgressStatus({
  overage,
  remaining,
  unit,
}: {
  overage: number;
  remaining: number;
  unit: 'kcal' | 'g';
}): string {
  if (overage > 0) {
    return `${unit === 'kcal' ? formatCalories(overage) : formatMacroGrams(overage)} ${unit} over target`;
  }

  if (remaining === 0) {
    return 'Target reached';
  }

  return `${unit === 'kcal' ? formatCalories(remaining) : formatMacroGrams(remaining)} ${unit} remaining`;
}

export function getClampedProgressRatio(progressRatio: number): number {
  if (!Number.isFinite(progressRatio)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progressRatio));
}

export function formatGoalLabel(goalType: GoalType): string {
  switch (goalType) {
    case 'lose':
      return 'Lose Weight';
    case 'gain':
      return 'Gain Weight / Muscle';
    case 'maintain':
      return 'Maintain Weight';
  }
}

export function formatActivityLabel(activityLevel: ActivityLevel): string {
  switch (activityLevel) {
    case 'sedentary':
      return 'Sedentary';
    case 'lightly_active':
      return 'Lightly Active';
    case 'moderately_active':
      return 'Moderately Active';
    case 'very_active':
      return 'Very Active';
    case 'extremely_active':
      return 'Extremely Active';
  }
}

export function formatWeight(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    return `${formatDecimal(kgToLb(kg))} lb`;
  }

  return `${formatDecimal(kg)} kg`;
}

export function formatWeeklyRate(
  weeklyRateKg: number | null,
  goalType: GoalType,
  unitSystem: UnitSystem,
): string | null {
  if (weeklyRateKg === null || goalType === 'maintain') {
    return null;
  }

  const sign = goalType === 'lose' ? '-' : '+';
  const absoluteRate = Math.abs(weeklyRateKg);
  const displayedRate = unitSystem === 'imperial' ? kgToLb(absoluteRate) : absoluteRate;
  const unit = unitSystem === 'imperial' ? 'lb/week' : 'kg/week';

  return `${sign}${formatDecimal(displayedRate)} ${unit}`;
}

export function getCalorieContext(goal: ActiveNutritionGoal): string {
  if (goal.goalType === 'maintain') {
    return `Maintenance: ~${formatCalories(goal.dailyCalories)} kcal`;
  }

  return `${formatGoalLabel(goal.goalType)}: ${formatCalories(goal.dailyCalories)} kcal/day`;
}

export function getMacroCalorieShare(
  grams: number,
  caloriesPerGram: number,
  totalMacroCalories: number,
) {
  if (totalMacroCalories <= 0) {
    return 0;
  }

  return Math.min(100, Math.round(((grams * caloriesPerGram) / totalMacroCalories) * 100));
}

function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return Number(value.toFixed(maximumFractionDigits)).toLocaleString('en-US', {
    maximumFractionDigits,
  });
}
