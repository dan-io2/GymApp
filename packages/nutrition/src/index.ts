export {
  ACTIVITY_MULTIPLIERS,
  DEFAULT_CALORIE_TARGET_OPTIONS,
  DEFAULT_KCAL_PER_KG,
  DEFAULT_MACRO_TARGET_OPTIONS,
} from './constants';
export { NutritionCalculationError } from './errors';
export {
  calculateBMR,
  calculateCalorieTarget,
  calculateMacroTargets,
  calculateNutritionPlan,
  calculateTDEE,
  cmToInches,
  getActivityMultiplier,
  inchesToCm,
  kgToLb,
  lbToKg,
  roundToWhole,
} from './calculations';
export type {
  ActivityLevel,
  BmrInput,
  CalorieTargetOptions,
  GoalType,
  MacroTargetInput,
  MacroTargetOptions,
  MacroTargets,
  NutritionCalculationErrorCode,
  NutritionPlan,
  NutritionPlanInput,
  SexForCalculation,
} from './types';
