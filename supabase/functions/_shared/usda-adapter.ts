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

  const servingMassGrams = getMassInGrams(servingSize, servingUnit);
  const canConvertToServing = servingMassGrams !== null;
  const multiplier = canConvertToServing ? servingMassGrams / 100 : 1;
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
    servingUnit: canConvertToServing ? normalizeServingUnit(servingUnit) : 'g',
    servingDescription: canConvertToServing
      ? (servingDescription ?? `${servingSize} ${servingUnit}`)
      : null,
    servingsPerContainer: null,
    servingBasis,
    calories: nutrients.calories * multiplier,
    proteinG: nutrients.proteinG * multiplier,
    carbsG: nutrients.carbsG * multiplier,
    fatG: nutrients.fatG * multiplier,
    fiberG: scaleNullable(nutrients.fiberG, multiplier),
    sugarG: scaleNullable(nutrients.sugarG, multiplier),
    sodiumMg: scaleNullable(nutrients.sodiumMg, multiplier),
  };
}

function getMassInGrams(size: number | null, unit: string | null): number | null {
  if (size === null || unit === null) {
    return null;
  }

  const normalizedUnit = normalizeServingUnit(unit);
  const factor = {
    g: 1,
    kg: 1000,
    oz: 28.349523125,
    lb: 453.59237,
  }[normalizedUnit];

  return factor === undefined ? null : size * factor;
}

function normalizeServingUnit(unit: string | null): string {
  const normalized = unit?.trim().toLowerCase();

  if (normalized === 'gram' || normalized === 'grams') {
    return 'g';
  }

  if (normalized === 'kilogram' || normalized === 'kilograms') {
    return 'kg';
  }

  if (normalized === 'ounce' || normalized === 'ounces') {
    return 'oz';
  }

  if (normalized === 'pound' || normalized === 'pounds') {
    return 'lb';
  }

  return normalized ?? '';
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

function scaleNullable(value: number | null, multiplier: number): number | null {
  return value === null ? null : value * multiplier;
}
