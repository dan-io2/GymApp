import { calculateNutritionPlan } from '@gymapp/nutrition';

import type {
  EditableGoalProfile,
  EditableNutritionGoal,
  GoalTargetValues,
} from '../types/goalEditingTypes';

export class RecommendedTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendedTargetError';
  }
}

export function calculateRecommendedTargets({
  goal,
  profile,
  today = new Date(),
}: {
  goal: EditableNutritionGoal;
  profile: EditableGoalProfile;
  today?: Date;
}): GoalTargetValues {
  if (
    !profile.dateOfBirth ||
    !profile.sexForCalculation ||
    !profile.heightCm ||
    !profile.currentWeightKg
  ) {
    throw new RecommendedTargetError(
      'Your profile is missing information needed to recalculate recommendations.',
    );
  }

  const ageYears = calculateAgeYears(profile.dateOfBirth, today);
  const plan = calculateNutritionPlan({
    sexForCalculation: profile.sexForCalculation,
    ageYears,
    heightCm: profile.heightCm,
    weightKg: profile.currentWeightKg,
    activityLevel: goal.activityLevel,
    goalType: goal.goalType,
    weeklyRateKg: goal.weeklyRateKg ?? undefined,
  });

  return {
    dailyCalories: plan.dailyCalories,
    proteinG: plan.proteinG,
    carbsG: plan.carbsG,
    fatG: plan.fatG,
  };
}

export function calculateAgeYears(dateOfBirth: string, today = new Date()): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    throw new RecommendedTargetError('Your profile birth date is invalid.');
  }

  let ageYears = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    ageYears -= 1;
  }

  if (ageYears <= 0) {
    throw new RecommendedTargetError('Your profile birth date is invalid.');
  }

  return ageYears;
}
