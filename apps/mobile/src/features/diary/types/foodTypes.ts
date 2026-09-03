export type FoodSource = 'usda' | 'open_food_facts' | 'fatsecret' | 'user' | 'internal';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ServingBasis = 'per_100g' | 'per_100ml' | 'per_serving' | 'unknown';
export type PortionUnit =
  'serving' | 'g' | 'kg' | 'oz' | 'lb' | 'ml' | 'l' | 'fl_oz' | 'cup' | 'tbsp' | 'tsp' | string;

export type PortionUnitOption = {
  unit: PortionUnit;
  label: string;
};

export type BarcodeIdentifier = {
  type: 'barcode';
  barcode: string;
};

export type ProviderFoodIdentifier = {
  type: 'provider';
  source: Exclude<FoodSource, 'user' | 'internal'>;
  externalId: string;
};

export type InternalFoodIdentifier = {
  type: 'internal';
  id: string;
};

export type FoodIdentifier = BarcodeIdentifier | ProviderFoodIdentifier | InternalFoodIdentifier;

export type Food = {
  id: string | null;
  externalId: string | null;
  source: FoodSource;
  barcode: string | null;
  name: string;
  brand: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  servingDescription: string | null;
  servingsPerContainer: number | null;
  servingBasis: ServingBasis;
  servingCalories: number;
  servingProteinG: number;
  servingCarbsG: number;
  servingFatG: number;
  servingFiberG: number | null;
  servingSugarG: number | null;
  servingSodiumMg: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  servingOptions?: FoodServingOption[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FoodServingOption = {
  id: string;
  servingDescription: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  servingBasis: ServingBasis;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  isDefault: boolean;
};

export type FoodLog = {
  id: string;
  userId: string;
  foodId: string | null;
  mealType: MealType;
  foodName: string;
  brand: string | null;
  quantity: number;
  itemQuantity: number;
  portionAmount: number;
  portionUnit: PortionUnit;
  servingEquivalent: number;
  servingSize: number | null;
  servingUnit: string | null;
  servingCalories: number;
  servingProteinG: number;
  servingCarbsG: number;
  servingFatG: number;
  servingFiberG: number | null;
  servingSugarG: number | null;
  servingSodiumMg: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  loggedAt: string;
  createdAt: string;
};

export type NutritionTotals = {
  caloriesConsumed: number;
  proteinConsumedG: number;
  carbsConsumedG: number;
  fatConsumedG: number;
};

export type NutritionProgress = {
  calories: MacroProgress;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
};

export type MacroProgress = {
  consumed: number;
  target: number;
  remaining: number;
  overage: number;
  percentage: number;
  progressRatio: number;
};

export type MealGroup = {
  mealType: MealType;
  label: string;
  logs: FoodLog[];
  totals: NutritionTotals;
};

export type NutritionTargets = {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type RemainingNutrition = {
  caloriesRemaining: number;
  proteinRemainingG: number;
  carbsRemainingG: number;
  fatRemainingG: number;
  caloriesOverage: number;
  proteinOverageG: number;
  carbsOverageG: number;
  fatOverageG: number;
};
