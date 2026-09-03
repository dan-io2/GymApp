import { ACTIVITY_MULTIPLIERS } from './constants';
import { NutritionCalculationError } from './errors';
import type { ActivityLevel, GoalType, SexForCalculation } from './types';

export function assertPositiveFinite(
  value: number,
  label: string,
  code: Parameters<typeof fail>[1],
) {
  if (!Number.isFinite(value) || value <= 0) {
    fail(`${label} must be greater than zero.`, code);
  }
}

export function assertSexForCalculation(value: string): asserts value is SexForCalculation {
  if (value !== 'male' && value !== 'female') {
    fail('Sex for calculation must be male or female.', 'INVALID_SEX');
  }
}

export function assertActivityLevel(value: string): asserts value is ActivityLevel {
  if (!(value in ACTIVITY_MULTIPLIERS)) {
    fail('Activity level is not supported.', 'INVALID_ACTIVITY_LEVEL');
  }
}

export function assertGoalType(value: string): asserts value is GoalType {
  if (value !== 'lose' && value !== 'maintain' && value !== 'gain') {
    fail('Goal type must be lose, maintain, or gain.', 'INVALID_GOAL_TYPE');
  }
}

export function assertWeeklyRate(value: number | undefined) {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value) || value <= 0 || value > 2) {
    fail(
      'Weekly rate must be greater than zero and no more than 2 kg per week.',
      'INVALID_WEEKLY_RATE',
    );
  }
}

function fail(
  message: string,
  code: ConstructorParameters<typeof NutritionCalculationError>[1],
): never {
  throw new NutritionCalculationError(message, code);
}
