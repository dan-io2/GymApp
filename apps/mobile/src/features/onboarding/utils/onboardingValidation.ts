import { NutritionCalculationError, calculateNutritionPlan } from '@gymapp/nutrition';

import type {
  NormalizedOnboardingInput,
  OnboardingFormState,
  OnboardingReview,
} from '../types/onboardingTypes';
import {
  getCurrentWeightKg,
  getHeightCm,
  getTargetWeightKg,
  getWeeklyRateKg,
} from './unitConversion';

export type ValidationResult<T> =
  | {
      data: T;
      ok: true;
    }
  | {
      errors: string[];
      ok: false;
    };

export function buildOnboardingReview(
  state: OnboardingFormState,
  today: Date = new Date(),
): ValidationResult<OnboardingReview> {
  const normalizedResult = normalizeOnboardingInput(state, today);

  if (!normalizedResult.ok) {
    return normalizedResult;
  }

  try {
    const plan = calculateNutritionPlan({
      sexForCalculation: normalizedResult.data.sexForCalculation,
      ageYears: calculateAgeYears(normalizedResult.data.dateOfBirth, today),
      heightCm: normalizedResult.data.heightCm,
      weightKg: normalizedResult.data.currentWeightKg,
      activityLevel: normalizedResult.data.activityLevel,
      goalType: normalizedResult.data.goalType,
      weeklyRateKg: normalizedResult.data.weeklyRateKg ?? undefined,
    });

    return {
      ok: true,
      data: {
        input: normalizedResult.data,
        ageYears: calculateAgeYears(normalizedResult.data.dateOfBirth, today),
        plan,
      },
    };
  } catch (error) {
    return {
      ok: false,
      errors: [
        error instanceof NutritionCalculationError
          ? error.message
          : 'The nutrition plan could not be calculated from these values.',
      ],
    };
  }
}

export function normalizeOnboardingInput(
  state: OnboardingFormState,
  today: Date = new Date(),
): ValidationResult<NormalizedOnboardingInput> {
  const errors: string[] = [];
  const dateOfBirthResult = validateDateOfBirth(state.dateOfBirth, today);
  const heightCm = getHeightCm(state);
  const currentWeightKg = getCurrentWeightKg(state);
  const targetWeightKg = getTargetWeightKg(state);
  const weeklyRateKg = getWeeklyRateKg(state);

  if (!dateOfBirthResult.ok) {
    errors.push(dateOfBirthResult.message);
  }

  if (!state.sexForCalculation) {
    errors.push('Choose the sex value used for the calorie calculation.');
  }

  if (heightCm === null || heightCm <= 0 || heightCm > 300) {
    errors.push('Enter a height greater than 0 and no more than 300 cm.');
  }

  if (currentWeightKg === null || currentWeightKg <= 0 || currentWeightKg > 1000) {
    errors.push('Enter a current weight greater than 0 and no more than 1000 kg.');
  }

  if (!state.activityLevel) {
    errors.push('Choose an activity level.');
  }

  if (!state.goalType) {
    errors.push('Choose a goal.');
  }

  if (targetWeightKg !== null && targetWeightKg > 1000) {
    errors.push('Enter a target weight no more than 1000 kg.');
  }

  if (weeklyRateKg !== null && weeklyRateKg > 2) {
    errors.push('Enter a weekly rate no more than 2 kg per week.');
  }

  if (state.goalType === 'maintain' && targetWeightKg !== null) {
    errors.push('Target weight is only used for lose or gain goals.');
  }

  if (
    errors.length > 0 ||
    !dateOfBirthResult.ok ||
    !state.sexForCalculation ||
    heightCm === null ||
    currentWeightKg === null ||
    !state.activityLevel ||
    !state.goalType
  ) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      dateOfBirth: dateOfBirthResult.value,
      sexForCalculation: state.sexForCalculation,
      heightCm: roundMetric(heightCm),
      currentWeightKg: roundMetric(currentWeightKg),
      preferredUnitSystem: state.unitSystem,
      activityLevel: state.activityLevel,
      goalType: state.goalType,
      targetWeightKg: targetWeightKg === null ? null : roundMetric(targetWeightKg),
      weeklyRateKg: weeklyRateKg === null ? null : roundMetric(weeklyRateKg),
    },
  };
}

export function validateDateOfBirth(
  value: string,
  today: Date = new Date(),
):
  | {
      ok: true;
      value: string;
    }
  | {
      message: string;
      ok: false;
    } {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      ok: false,
      message: 'Enter your date of birth.',
    };
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(trimmedValue)) {
    return {
      ok: false,
      message: 'Use date format YYYY-MM-DD.',
    };
  }

  const parsedDate = parseDateOnly(trimmedValue);
  const minimumDate = parseDateOnly('1900-01-01');
  const todayOnly = parseDateOnly(formatDateOnly(today));

  if (
    !parsedDate ||
    !minimumDate ||
    !todayOnly ||
    parsedDate < minimumDate ||
    parsedDate > todayOnly
  ) {
    return {
      ok: false,
      message: 'Enter a valid past birth date.',
    };
  }

  if (calculateAgeYears(trimmedValue, today) <= 0) {
    return {
      ok: false,
      message: 'Enter a birth date that makes age greater than zero.',
    };
  }

  return {
    ok: true,
    value: trimmedValue,
  };
}

export function calculateAgeYears(dateOfBirth: string, today: Date = new Date()): number {
  const birthDate = parseDateOnly(dateOfBirth);

  if (!birthDate) {
    return 0;
  }

  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasBirthdayPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}
