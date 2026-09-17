import type {
  Food,
  FoodLog,
  MacroProgress,
  MealGroup,
  MealType,
  NutritionProgress,
  NutritionTargets,
  NutritionTotals,
  PortionUnit,
  RemainingNutrition,
} from '../types/foodTypes';
import { calculateLogPortionNutrition, calculatePortionNutrition } from './portionUtils';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

export function isValidMealType(value: string): value is MealType {
  return MEAL_TYPES.includes(value as MealType);
}

export function assertValidMealType(value: string): MealType {
  if (!isValidMealType(value)) {
    throw new Error('Meal type is invalid.');
  }

  return value;
}

export function calculateFoodLogSnapshot({
  food,
  mealType,
  quantity,
  portionAmount,
  portionUnit,
  itemQuantity = 1,
  userId,
  loggedAt = new Date().toISOString(),
}: {
  food: Food;
  mealType: MealType;
  quantity: number;
  portionAmount?: number;
  portionUnit?: PortionUnit;
  itemQuantity?: number;
  userId: string;
  loggedAt?: string;
}): Omit<FoodLog, 'id' | 'createdAt'> {
  const amount = portionAmount ?? quantity;
  const unit = portionUnit ?? 'serving';
  const portion = calculatePortionNutrition({ amount, food, itemQuantity, unit });

  return {
    userId,
    foodId: food.id,
    mealType,
    foodName: food.name,
    brand: food.brand,
    quantity: portion.servingEquivalent,
    itemQuantity,
    portionAmount: amount,
    portionUnit: unit,
    servingEquivalent: portion.servingEquivalent,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    servingCalories: food.calories,
    servingProteinG: food.proteinG,
    servingCarbsG: food.carbsG,
    servingFatG: food.fatG,
    servingFiberG: food.fiberG,
    servingSugarG: food.sugarG,
    servingSodiumMg: food.sodiumMg,
    calories: portion.calories,
    proteinG: portion.proteinG,
    carbsG: portion.carbsG,
    fatG: portion.fatG,
    fiberG: portion.fiberG,
    sugarG: portion.sugarG,
    sodiumMg: portion.sodiumMg,
    loggedAt,
  };
}

export function calculateFoodLogTotalsFromServing(
  log: Pick<
    FoodLog,
    | 'servingCalories'
    | 'servingProteinG'
    | 'servingCarbsG'
    | 'servingFatG'
    | 'servingFiberG'
    | 'servingSugarG'
    | 'servingSodiumMg'
  >,
  quantity: number,
) {
  assertPositiveQuantity(quantity);

  return {
    calories: log.servingCalories * quantity,
    proteinG: log.servingProteinG * quantity,
    carbsG: log.servingCarbsG * quantity,
    fatG: log.servingFatG * quantity,
    fiberG: multiplyNullableNutrition(log.servingFiberG, quantity),
    sugarG: multiplyNullableNutrition(log.servingSugarG, quantity),
    sodiumMg: multiplyNullableNutrition(log.servingSodiumMg, quantity),
  };
}

export function calculateFoodLogTotalsFromPortion(
  log: FoodLog,
  portionAmount: number,
  portionUnit: PortionUnit,
  itemQuantity = 1,
) {
  const portion = calculateLogPortionNutrition({
    amount: portionAmount,
    itemQuantity,
    log,
    unit: portionUnit,
  });

  return {
    quantity: portion.servingEquivalent,
    itemQuantity,
    portionAmount,
    portionUnit,
    servingEquivalent: portion.servingEquivalent,
    calories: portion.calories,
    proteinG: portion.proteinG,
    carbsG: portion.carbsG,
    fatG: portion.fatG,
    fiberG: portion.fiberG,
    sugarG: portion.sugarG,
    sodiumMg: portion.sodiumMg,
  };
}

export function aggregateDailyNutrition(logs: FoodLog[]): NutritionTotals {
  return logs.reduce<NutritionTotals>(
    (totals, log) => ({
      caloriesConsumed: totals.caloriesConsumed + log.calories,
      proteinConsumedG: totals.proteinConsumedG + log.proteinG,
      carbsConsumedG: totals.carbsConsumedG + log.carbsG,
      fatConsumedG: totals.fatConsumedG + log.fatG,
    }),
    {
      caloriesConsumed: 0,
      proteinConsumedG: 0,
      carbsConsumedG: 0,
      fatConsumedG: 0,
    },
  );
}

export function calculateRemainingNutrition(
  targets: NutritionTargets,
  consumed: NutritionTotals,
): RemainingNutrition {
  const caloriesDifference = targets.dailyCalories - consumed.caloriesConsumed;
  const proteinDifference = targets.proteinG - consumed.proteinConsumedG;
  const carbsDifference = targets.carbsG - consumed.carbsConsumedG;
  const fatDifference = targets.fatG - consumed.fatConsumedG;

  return {
    caloriesRemaining: Math.max(0, caloriesDifference),
    proteinRemainingG: Math.max(0, proteinDifference),
    carbsRemainingG: Math.max(0, carbsDifference),
    fatRemainingG: Math.max(0, fatDifference),
    caloriesOverage: Math.max(0, -caloriesDifference),
    proteinOverageG: Math.max(0, -proteinDifference),
    carbsOverageG: Math.max(0, -carbsDifference),
    fatOverageG: Math.max(0, -fatDifference),
  };
}

export function calculateNutritionProgress(
  targets: NutritionTargets,
  consumed: NutritionTotals,
): NutritionProgress {
  const remaining = calculateRemainingNutrition(targets, consumed);

  return {
    calories: createMacroProgress(
      consumed.caloriesConsumed,
      targets.dailyCalories,
      remaining.caloriesRemaining,
      remaining.caloriesOverage,
    ),
    protein: createMacroProgress(
      consumed.proteinConsumedG,
      targets.proteinG,
      remaining.proteinRemainingG,
      remaining.proteinOverageG,
    ),
    carbs: createMacroProgress(
      consumed.carbsConsumedG,
      targets.carbsG,
      remaining.carbsRemainingG,
      remaining.carbsOverageG,
    ),
    fat: createMacroProgress(
      consumed.fatConsumedG,
      targets.fatG,
      remaining.fatRemainingG,
      remaining.fatOverageG,
    ),
  };
}

export function groupLogsByMeal(logs: FoodLog[]): MealGroup[] {
  return MEAL_TYPES.map((mealType) => {
    const mealLogs = logs.filter((log) => log.mealType === mealType);

    return {
      mealType,
      label: MEAL_LABELS[mealType],
      logs: mealLogs,
      totals: aggregateDailyNutrition(mealLogs),
    };
  });
}

export function getLocalDayRange(date: Date): { start: string; end: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function filterLogsForLocalDate(logs: FoodLog[], date: Date): FoodLog[] {
  const { start, end } = getLocalDayRange(date);
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);

  return logs.filter((log) => {
    const loggedAtMs = Date.parse(log.loggedAt);
    return loggedAtMs >= startMs && loggedAtMs < endMs;
  });
}

export function assertPositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('Quantity must be greater than zero.');
  }
}

export function parseQuantity(value: string): number | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const quantity = Number(normalized);

  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

export function getDefaultMealType(date = new Date()): MealType {
  const hour = date.getHours();

  if (hour < 11) {
    return 'breakfast';
  }

  if (hour < 16) {
    return 'lunch';
  }

  if (hour < 21) {
    return 'dinner';
  }

  return 'snack';
}

export function formatQuantity(value: number): string {
  return formatFiniteNumber(value, 2);
}

export function formatNutritionValue(value: number): string {
  return formatFiniteNumber(value, 1);
}

export function calculateTotalServingAmount({
  quantity,
  servingSize,
}: {
  quantity: number;
  servingSize: number | null;
}): number | null {
  return servingSize === null ? null : servingSize * quantity;
}

function multiplyNullableNutrition(value: number | null, quantity: number): number | null {
  return value === null ? null : value * quantity;
}

function formatFiniteNumber(value: number, maximumFractionDigits: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const normalized = Object.is(value, -0) ? 0 : value;

  return Number(normalized.toFixed(maximumFractionDigits)).toString();
}

function createMacroProgress(
  consumed: number,
  target: number,
  remaining: number,
  overage: number,
): MacroProgress {
  const percentage =
    target > 0 && Number.isFinite(consumed) ? Math.round((consumed / target) * 10000) / 100 : 0;
  const ratio = target > 0 && Number.isFinite(consumed) ? consumed / target : 0;

  return {
    consumed,
    target,
    remaining,
    overage,
    percentage,
    progressRatio: Math.max(0, Math.min(1, ratio)),
  };
}
