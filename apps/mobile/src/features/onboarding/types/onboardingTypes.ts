import type { ActivityLevel, GoalType, NutritionPlan, SexForCalculation } from '@gymapp/nutrition';

export type UnitSystem = 'imperial' | 'metric';

export type OnboardingStepId =
  | 'welcome'
  | 'units'
  | 'dateOfBirth'
  | 'sex'
  | 'height'
  | 'weight'
  | 'activity'
  | 'goal'
  | 'target'
  | 'review';

export type OnboardingFormState = {
  unitSystem: UnitSystem;
  dateOfBirth: string;
  sexForCalculation: SexForCalculation | null;
  heightCm: string;
  heightFeet: string;
  heightInches: string;
  weightKg: string;
  weightLb: string;
  activityLevel: ActivityLevel | null;
  goalType: GoalType | null;
  targetWeightKg: string;
  targetWeightLb: string;
  weeklyRateKg: string;
  weeklyRateLb: string;
};

export type NormalizedOnboardingInput = {
  dateOfBirth: string;
  sexForCalculation: SexForCalculation;
  heightCm: number;
  currentWeightKg: number;
  preferredUnitSystem: UnitSystem;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetWeightKg: number | null;
  weeklyRateKg: number | null;
};

export type OnboardingReview = {
  input: NormalizedOnboardingInput;
  ageYears: number;
  plan: NutritionPlan;
};

export type CompleteOnboardingInput = NormalizedOnboardingInput & {
  userId: string;
  plan: NutritionPlan;
};
