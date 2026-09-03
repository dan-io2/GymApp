import type { NormalizedFoodResult, NormalizedServingOption, ServingBasis } from './food-types.ts';

type FatSecretFoodResponse = {
  food?: FatSecretFood;
};

type FatSecretSearchResponse = {
  foods_search?: {
    results?: {
      food?: FatSecretFood[] | FatSecretFood;
    };
  };
};

type FatSecretAutocompleteResponse = {
  suggestions?: {
    suggestion?: string[] | string;
  };
};

type FatSecretFood = {
  food_id?: string | number;
  food_name?: string;
  food_type?: string;
  brand_name?: string;
  servings?: {
    serving?: FatSecretServing[] | FatSecretServing;
  };
};

type FatSecretServing = {
  serving_id?: string | number;
  serving_description?: string;
  metric_serving_amount?: string | number;
  metric_serving_unit?: string;
  measurement_description?: string;
  calories?: string | number;
  carbohydrate?: string | number;
  protein?: string | number;
  fat?: string | number;
  fiber?: string | number;
  sugar?: string | number;
  sodium?: string | number;
  is_default?: string | number;
};

type NutritionValues = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

export function normalizeFatSecretSearchResponse(
  response: FatSecretSearchResponse,
): NormalizedFoodResult[] {
  return asArray(response.foods_search?.results?.food)
    .map(normalizeFatSecretFood)
    .filter((food): food is NormalizedFoodResult => food !== null);
}

export function normalizeFatSecretFoodResponse(
  response: FatSecretFoodResponse,
): NormalizedFoodResult | null {
  return response.food ? normalizeFatSecretFood(response.food) : null;
}

export function normalizeFatSecretAutocompleteResponse(
  response: FatSecretAutocompleteResponse,
): string[] {
  return asArray(response.suggestions?.suggestion)
    .map((suggestion) => suggestion.trim())
    .filter(Boolean);
}

export function normalizeFatSecretFood(food: FatSecretFood): NormalizedFoodResult | null {
  const externalId = normalizeText(food.food_id);
  const name = normalizeText(food.food_name);

  if (!externalId || !name) {
    return null;
  }

  const servingOptions = asArray(food.servings?.serving)
    .map(normalizeServing)
    .filter((serving): serving is NormalizedServingOption => serving !== null);

  const defaultServing = chooseDefaultServing(servingOptions);

  if (!defaultServing) {
    return null;
  }

  return {
    id: null,
    externalId,
    source: 'fatsecret',
    sourceLabel: 'FatSecret',
    barcode: null,
    name,
    brand: normalizeText(food.brand_name),
    servingSize: defaultServing.servingSize,
    servingUnit: defaultServing.servingUnit,
    servingDescription: defaultServing.servingDescription,
    servingsPerContainer: null,
    servingBasis: defaultServing.servingBasis,
    calories: defaultServing.calories,
    proteinG: defaultServing.proteinG,
    carbsG: defaultServing.carbsG,
    fatG: defaultServing.fatG,
    fiberG: defaultServing.fiberG,
    sugarG: defaultServing.sugarG,
    sodiumMg: defaultServing.sodiumMg,
    servingOptions,
  };
}

function normalizeServing(serving: FatSecretServing): NormalizedServingOption | null {
  const id = normalizeText(serving.serving_id) ?? normalizeText(serving.serving_description);
  const nutrition = readNutrition(serving);

  if (!id || !nutrition) {
    return null;
  }

  const metricAmount = readPositiveNumber(serving.metric_serving_amount);
  const metricUnit = normalizeServingUnit(serving.metric_serving_unit);

  return {
    id,
    servingDescription: normalizeText(serving.serving_description),
    servingSize: metricAmount,
    servingUnit: metricUnit,
    servingBasis: getServingBasis(metricAmount, metricUnit),
    ...nutrition,
    isDefault: serving.is_default === 1 || serving.is_default === '1',
  };
}

function chooseDefaultServing(
  servings: NormalizedServingOption[],
): NormalizedServingOption | undefined {
  return (
    servings.find((serving) => serving.isDefault) ??
    servings.find((serving) => serving.servingDescription?.toLowerCase() !== '100 g') ??
    servings[0]
  );
}

function readNutrition(serving: FatSecretServing): NutritionValues | null {
  const calories = readNumber(serving.calories);
  const proteinG = readNumber(serving.protein);
  const carbsG = readNumber(serving.carbohydrate);
  const fatG = readNumber(serving.fat);

  if (calories === null || proteinG === null || carbsG === null || fatG === null) {
    return null;
  }

  return {
    calories: roundNutrition(calories),
    proteinG: roundNutrition(proteinG),
    carbsG: roundNutrition(carbsG),
    fatG: roundNutrition(fatG),
    fiberG: nullableRound(readNumber(serving.fiber)),
    sugarG: nullableRound(readNumber(serving.sugar)),
    sodiumMg: nullableRound(readNumber(serving.sodium)),
  };
}

function getServingBasis(size: number | null, unit: string | null): ServingBasis {
  if (size === null || unit === null) {
    return 'per_serving';
  }

  if (unit === 'g' && size === 100) {
    return 'per_100g';
  }

  if (unit === 'ml' && size === 100) {
    return 'per_100ml';
  }

  return 'per_serving';
}

function normalizeServingUnit(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'gram' || normalized === 'grams') {
    return 'g';
  }

  if (normalized === 'milliliter' || normalized === 'milliliters') {
    return 'ml';
  }

  return normalized;
}

function normalizeText(value: string | number | undefined): string | null {
  const normalized = value?.toString().trim();

  return normalized ? normalized : null;
}

function readPositiveNumber(value: string | number | undefined): number | null {
  const number = readNumber(value);

  return number !== null && number > 0 ? number : null;
}

function readNumber(value: string | number | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asArray<T>(value: T[] | T | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function nullableRound(value: number | null): number | null {
  return value === null ? null : roundNutrition(value);
}

function roundNutrition(value: number): number {
  return Number(value.toFixed(2));
}
