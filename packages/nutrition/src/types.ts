export type SexForCalculation = 'male' | 'female';

export type ActivityLevel =
  'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

export type GoalType = 'lose' | 'maintain' | 'gain';

export type NutritionPlanInput = {
  sexForCalculation: SexForCalculation;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  weeklyRateKg?: number | undefined;
  calorieOptions?: CalorieTargetOptions | undefined;
  macroOptions?: MacroTargetOptions | undefined;
};

export type NutritionPlan = {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type BmrInput = {
  sexForCalculation: SexForCalculation;
  ageYears: number;
  heightCm: number;
  weightKg: number;
};

export type CalorieTargetOptions = {
  defaultWeeklyRateKgByGoal?: Partial<Record<Exclude<GoalType, 'maintain'>, number>> | undefined;
  kcalPerKg?: number | undefined;
};

export type MacroTargetInput = {
  dailyCalories: number;
  weightKg: number;
  options?: MacroTargetOptions | undefined;
};

export type MacroTargets = {
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MacroTargetOptions = {
  proteinGramsPerKg?: number | undefined;
  fatGramsPerKg?: number | undefined;
};

export type NutritionCalculationErrorCode =
  | 'INVALID_ACTIVITY_LEVEL'
  | 'INVALID_AGE'
  | 'INVALID_CALORIE_TARGET'
  | 'INVALID_GOAL_TYPE'
  | 'INVALID_HEIGHT'
  | 'INVALID_MACRO_STRATEGY'
  | 'INVALID_SEX'
  | 'INVALID_WEEKLY_RATE'
  | 'INVALID_WEIGHT'
  | 'MACRO_CALORIES_EXCEED_TARGET';
