import type { NormalizedFoodResult } from './food-types.ts';

type UsdaSearchFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaSearchNutrient[];
};

type UsdaSearchNutrient = {
  nutrientId?: number;
  nutrientName?: string;
  value?: number;
};

type UsdaDetailFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaDetailNutrient[];
};

type UsdaDetailNutrient = {
  amount?: number;
  nutrient?: {
    id?: number;
    number?: string;
    name?: string;
  };
};

type NutrientValues = {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

export function normalizeUsdaSearchFood(food: UsdaSearchFood): NormalizedFoodResult | null {
  if (!food.fdcId || !food.description) {
    return null;
  }

  const nutrients = extractSearchNutrients(food.foodNutrients ?? []);

  return createUsdaFood({
    brand: food.brandOwner ?? food.brandName ?? null,
    externalId: food.fdcId.toString(),
    name: food.description,
    nutrients,
    servingDescription: food.householdServingFullText ?? null,
    servingSize: food.servingSize ?? null,
    servingUnit: food.servingSizeUnit ?? null,
  });
}

export function normalizeUsdaDetailFood(food: UsdaDetailFood): NormalizedFoodResult | null {
  if (!food.fdcId || !food.description) {
    return null;
  }

  const nutrients = extractDetailNutrients(food.foodNutrients ?? []);

  return createUsdaFood({
    brand: food.brandOwner ?? food.brandName ?? null,
    externalId: food.fdcId.toString(),
    name: food.description,
    nutrients,
    servingDescription: food.householdServingFullText ?? null,
    servingSize: food.servingSize ?? null,
    servingUnit: food.servingSizeUnit ?? null,
  });
}

function createUsdaFood({
  brand,
  externalId,
  name,
  nutrients,
  servingDescription,
  servingSize,
  servingUnit,
}: {
  brand: string | null;
  externalId: string;
  name: string;
  nutrients: NutrientValues;
  servingDescription: string | null;
  servingSize: number | null;
  servingUnit: string | null;
}): NormalizedFoodResult | null {
  if (
    nutrients.calories === null ||
    nutrients.proteinG === null ||
    nutrients.carbsG === null ||
    nutrients.fatG === null
  ) {
    return null;
  }

  const canConvertToServing =
    servingSize !== null && servingUnit !== null && servingUnit.toLowerCase() === 'g';
  const multiplier = canConvertToServing ? servingSize / 100 : 1;
  const servingBasis = canConvertToServing ? 'per_serving' : 'per_100g';

  return {
    id: null,
    externalId,
    source: 'usda',
    sourceLabel: 'USDA FoodData Central',
    barcode: null,
    name,
    brand,
    servingSize: canConvertToServing ? servingSize : 100,
    servingUnit: canConvertToServing ? servingUnit : 'g',
    servingDescription: canConvertToServing
      ? (servingDescription ?? `${servingSize} ${servingUnit}`)
      : null,
    servingsPerContainer: null,
    servingBasis,
    calories: roundNutrition(nutrients.calories * multiplier),
    proteinG: roundNutrition(nutrients.proteinG * multiplier),
    carbsG: roundNutrition(nutrients.carbsG * multiplier),
    fatG: roundNutrition(nutrients.fatG * multiplier),
    fiberG: nullableRound(scaleNullable(nutrients.fiberG, multiplier)),
    sugarG: nullableRound(scaleNullable(nutrients.sugarG, multiplier)),
    sodiumMg: nullableRound(scaleNullable(nutrients.sodiumMg, multiplier)),
  };
}

function extractSearchNutrients(nutrients: UsdaSearchNutrient[]): NutrientValues {
  return nutrients.reduce<NutrientValues>(
    (values, nutrient) => assignNutrient(values, nutrient.nutrientId, nutrient.value),
    emptyNutrients(),
  );
}

function extractDetailNutrients(nutrients: UsdaDetailNutrient[]): NutrientValues {
  return nutrients.reduce<NutrientValues>(
    (values, nutrient) => assignNutrient(values, nutrient.nutrient?.id, nutrient.amount),
    emptyNutrients(),
  );
}

function assignNutrient(
  values: NutrientValues,
  nutrientId: number | undefined,
  amount: number | undefined,
): NutrientValues {
  if (nutrientId === undefined || amount === undefined || !Number.isFinite(amount)) {
    return values;
  }

  switch (nutrientId) {
    case 1008:
      return { ...values, calories: amount };
    case 1003:
      return { ...values, proteinG: amount };
    case 1005:
      return { ...values, carbsG: amount };
    case 1004:
      return { ...values, fatG: amount };
    case 1079:
      return { ...values, fiberG: amount };
    case 2000:
      return { ...values, sugarG: amount };
    case 1093:
      return { ...values, sodiumMg: amount };
    default:
      return values;
  }
}

function emptyNutrients(): NutrientValues {
  return {
    calories: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
  };
}

function nullableRound(value: number | null): number | null {
  return value === null ? null : roundNutrition(value);
}

function scaleNullable(value: number | null, multiplier: number): number | null {
  return value === null ? null : value * multiplier;
}

function roundNutrition(value: number): number {
  return Number(value.toFixed(2));
}
