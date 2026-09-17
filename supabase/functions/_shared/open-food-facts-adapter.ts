import type { NormalizedFoodResult, ServingBasis } from './food-types.ts';

type OpenFoodFactsResponse = {
  code?: string;
  status?: string;
  product?: OpenFoodFactsProduct;
};

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  number_of_servings?: string | number;
  serving_quantity?: string | number;
  serving_quantity_unit?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

export function normalizeOpenFoodFactsProduct(
  response: OpenFoodFactsResponse,
): NormalizedFoodResult | null {
  const product = response.product;
  const barcode = product?.code ?? response.code ?? null;
  const name = product?.product_name_en ?? product?.product_name;

  if (!product || !barcode || !name) {
    return null;
  }

  const serving = getServing(product);
  const nutrition = getNutrition(product.nutriments ?? {}, serving);

  if (
    nutrition.calories === null ||
    nutrition.proteinG === null ||
    nutrition.carbsG === null ||
    nutrition.fatG === null
  ) {
    return null;
  }

  const normalized = {
    id: null,
    externalId: barcode,
    source: 'open_food_facts',
    sourceLabel: 'Open Food Facts',
    barcode,
    name,
    brand: product.brands ?? null,
    servingSize: serving.size,
    servingUnit: serving.unit,
    servingDescription: serving.description,
    servingsPerContainer: readPositiveNumber(product.number_of_servings),
    servingBasis: nutrition.servingBasis,
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: nutrition.fiberG,
    sugarG: nutrition.sugarG,
    sodiumMg: nutrition.sodiumMg,
  };

  warnOnSuspiciousServingNutrition(normalized);

  return normalized;
}

function getNutrition(
  nutriments: Record<string, number | string | undefined>,
  serving: NormalizedServing,
) {
  const servingNutrition = readNutritionForSuffix(nutriments, 'serving');

  if (hasRequiredNutrition(servingNutrition) && serving.size !== null) {
    return {
      servingBasis: 'per_serving' as ServingBasis,
      ...servingNutrition,
    };
  }

  const per100gNutrition = readNutritionForSuffix(nutriments, '100g');

  const servingMassGrams = getMassInGrams(serving);

  if (hasRequiredNutrition(per100gNutrition) && servingMassGrams !== null) {
    return {
      servingBasis: 'per_serving' as ServingBasis,
      ...scaleNutrition(per100gNutrition, servingMassGrams / 100),
    };
  }

  return {
    servingBasis: 'per_100g' as ServingBasis,
    ...per100gNutrition,
  };
}

type NormalizedServing = {
  size: number | null;
  unit: string | null;
  description: string | null;
};

type NutritionValues = {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

function getServing(product: OpenFoodFactsProduct): NormalizedServing {
  const servingQuantity = readPositiveNumber(product.serving_quantity);
  const servingUnit = normalizeServingUnit(product.serving_quantity_unit);
  const parsedServingSize = parseServingSize(product.serving_size);

  return {
    size: servingQuantity ?? parsedServingSize.size,
    unit: servingUnit ?? parsedServingSize.unit,
    description: normalizeText(product.serving_size),
  };
}

function parseServingSize(value: string | undefined): { size: number | null; unit: string | null } {
  if (!value) {
    return { size: null, unit: null };
  }

  const match = value.match(
    /([0-9]+(?:[.,][0-9]+)?)\s*(g|gram|grams|ml|milliliter|milliliters)\b/i,
  );

  if (!match) {
    return { size: null, unit: null };
  }

  return {
    size: readPositiveNumber(match[1]),
    unit: normalizeServingUnit(match[2]),
  };
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

  if (normalized === 'kilogram' || normalized === 'kilograms') {
    return 'kg';
  }

  if (normalized === 'ounce' || normalized === 'ounces') {
    return 'oz';
  }

  if (normalized === 'pound' || normalized === 'pounds') {
    return 'lb';
  }

  return normalized;
}

function getMassInGrams(serving: NormalizedServing): number | null {
  if (serving.size === null || serving.unit === null) {
    return null;
  }

  const factor = {
    g: 1,
    kg: 1000,
    oz: 28.349523125,
    lb: 453.59237,
  }[serving.unit];

  return factor === undefined ? null : serving.size * factor;
}

function normalizeText(value: string | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function readPositiveNumber(value: number | string | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function readNutritionForSuffix(
  nutriments: Record<string, number | string | undefined>,
  suffix: '100g' | 'serving',
): NutritionValues {
  return {
    calories: readNutrient(nutriments, `energy-kcal_${suffix}`),
    proteinG: readNutrient(nutriments, `proteins_${suffix}`),
    carbsG: readNutrient(nutriments, `carbohydrates_${suffix}`),
    fatG: readNutrient(nutriments, `fat_${suffix}`),
    fiberG: readNutrient(nutriments, `fiber_${suffix}`),
    sugarG: readNutrient(nutriments, `sugars_${suffix}`),
    sodiumMg: convertSodiumToMg(readNutrient(nutriments, `sodium_${suffix}`)),
  };
}

function hasRequiredNutrition(nutrition: NutritionValues): boolean {
  return (
    nutrition.calories !== null &&
    nutrition.proteinG !== null &&
    nutrition.carbsG !== null &&
    nutrition.fatG !== null
  );
}

function scaleNutrition(nutrition: NutritionValues, multiplier: number): NutritionValues {
  return {
    calories: scaleNullable(nutrition.calories, multiplier),
    proteinG: scaleNullable(nutrition.proteinG, multiplier),
    carbsG: scaleNullable(nutrition.carbsG, multiplier),
    fatG: scaleNullable(nutrition.fatG, multiplier),
    fiberG: scaleNullable(nutrition.fiberG, multiplier),
    sugarG: scaleNullable(nutrition.sugarG, multiplier),
    sodiumMg: scaleNullable(nutrition.sodiumMg, multiplier),
  };
}

function scaleNullable(value: number | null, multiplier: number): number | null {
  return value === null ? null : value * multiplier;
}

function readNutrient(
  nutriments: Record<string, number | string | undefined>,
  key: string,
): number | null {
  const value = nutriments[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function convertSodiumToMg(sodiumG: number | null): number | null {
  return sodiumG === null ? null : sodiumG * 1000;
}

function warnOnSuspiciousServingNutrition(food: NormalizedFoodResult) {
  if (
    food.servingBasis !== 'per_serving' ||
    food.servingUnit !== 'g' ||
    food.servingSize === null
  ) {
    return;
  }

  const macroMass =
    food.proteinG + food.carbsG + food.fatG + (food.fiberG ?? 0) + (food.sugarG ?? 0);

  if (macroMass > food.servingSize * 1.5) {
    console.warn('[GymApp provider sanity]', {
      barcode: food.barcode,
      macroMass,
      provider: food.source,
      servingSize: food.servingSize,
    });
  }
}
