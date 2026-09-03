import type { ActivityLevel, GoalType, SexForCalculation } from '@gymapp/nutrition';

import type { TargetSource, UnitSystem } from '@/features/dashboard/types/dashboardTypes';

export type EditableGoalProfile = {
  id: string;
  dateOfBirth: string | null;
  sexForCalculation: SexForCalculation | null;
  heightCm: number | null;
  currentWeightKg: number | null;
  preferredUnitSystem: UnitSystem;
};

export type EditableNutritionGoal = {
  id: string;
  goalType: GoalType;
  targetWeightKg: number | null;
  activityLevel: ActivityLevel;
  weeklyRateKg: number | null;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  targetSource: TargetSource;
  createdAt: string;
};

export type GoalEditingData = {
  profile: EditableGoalProfile;
  activeGoal: EditableNutritionGoal;
};

export type GoalTargetForm = {
  dailyCalories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

export type GoalTargetValues = {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type GoalTargetSource = 'recommended' | 'custom';
