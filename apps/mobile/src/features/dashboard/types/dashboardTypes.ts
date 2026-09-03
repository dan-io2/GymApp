import type { ActivityLevel, GoalType } from '@gymapp/nutrition';
import type { NutritionProgress, NutritionTotals } from '@/features/diary/types/foodTypes';

export type UnitSystem = 'imperial' | 'metric';
export type TargetSource = 'recommended' | 'custom';

export type DashboardProfile = {
  id: string;
  preferredUnitSystem: UnitSystem;
  currentWeightKg: number | null;
};

export type ActiveNutritionGoal = {
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

export type DashboardData = {
  profile: DashboardProfile;
  activeGoal: ActiveNutritionGoal | null;
  dailyTotals: NutritionTotals;
  dailyProgress: NutritionProgress | null;
};
