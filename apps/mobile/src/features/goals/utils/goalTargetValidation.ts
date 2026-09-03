import type { GoalTargetForm, GoalTargetValues } from '../types/goalEditingTypes';

export type MacroCalorieSummary = {
  macroCalories: number;
  difference: number;
};

export type GoalTargetValidationResult =
  | {
      isValid: true;
      values: GoalTargetValues;
      warnings: string[];
      macroSummary: MacroCalorieSummary;
    }
  | {
      isValid: false;
      errors: string[];
      warnings: string[];
      macroSummary: MacroCalorieSummary | null;
    };

export function validateGoalTargetForm(form: GoalTargetForm): GoalTargetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const dailyCalories = parseTargetNumber(form.dailyCalories, 'Daily calories', errors);
  const proteinG = parseTargetNumber(form.proteinG, 'Protein', errors);
  const carbsG = parseTargetNumber(form.carbsG, 'Carbs', errors);
  const fatG = parseTargetNumber(form.fatG, 'Fat', errors);

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      macroSummary: null,
    };
  }

  const values = {
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
  };
  const macroSummary = calculateMacroCalories(values);

  if (dailyCalories > 0 && dailyCalories < 1200) {
    warnings.push('You entered a very low calorie target. Please verify this value.');
  }

  if (Math.abs(macroSummary.difference) >= Math.max(250, dailyCalories * 0.1)) {
    warnings.push(
      `Your macro targets add up to approximately ${macroSummary.macroCalories.toLocaleString('en-US')} calories, which is significantly different from your ${dailyCalories.toLocaleString('en-US')} calorie target.`,
    );
  }

  return {
    isValid: true,
    values,
    warnings,
    macroSummary,
  };
}

export function calculateMacroCalories(values: GoalTargetValues): MacroCalorieSummary {
  const macroCalories = values.proteinG * 4 + values.carbsG * 4 + values.fatG * 9;

  return {
    macroCalories,
    difference: macroCalories - values.dailyCalories,
  };
}

function parseTargetNumber(value: string, label: string, errors: string[]): number {
  const trimmedValue = value.trim();
  const parsed = Number(trimmedValue);

  if (!trimmedValue || !Number.isFinite(parsed) || Number.isNaN(parsed)) {
    errors.push(`${label} must be a valid number.`);
    return 0;
  }

  if (parsed < 0) {
    errors.push(`${label} cannot be negative.`);
    return 0;
  }

  return Math.round(parsed);
}
