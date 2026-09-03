import type { Food, FoodLog, PortionUnit, PortionUnitOption } from '../types/foodTypes';

export const GRAMS_PER_KILOGRAM = 1000;
export const GRAMS_PER_OUNCE = 28.349523125;
export const GRAMS_PER_POUND = 453.59237;

export const MILLILITERS_PER_LITER = 1000;
export const MILLILITERS_PER_FLUID_OUNCE = 29.5735295625;
export const MILLILITERS_PER_CUP = 236.5882365;
export const MILLILITERS_PER_TABLESPOON = 14.78676478125;
export const MILLILITERS_PER_TEASPOON = 4.92892159375;

type Dimension = 'mass' | 'volume' | 'serving' | 'household';

type NutritionValues = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
};

export type PortionCalculation = NutritionValues & {
  itemQuantity: number;
  servingEquivalent: number;
  normalizedAmount: number;
  normalizedUnit: 'g' | 'ml' | 'serving';
  portionAmount: number;
  portionUnit: PortionUnit;
};

export class UnsupportedPortionConversionError extends Error {
  constructor(message = 'Portion conversion is unsupported for this food.') {
    super(message);
    this.name = 'UnsupportedPortionConversionError';
  }
}

const MASS_FACTORS_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: GRAMS_PER_KILOGRAM,
  oz: GRAMS_PER_OUNCE,
  lb: GRAMS_PER_POUND,
};

const VOLUME_FACTORS_TO_MILLILITERS: Record<string, number> = {
  ml: 1,
  l: MILLILITERS_PER_LITER,
  fl_oz: MILLILITERS_PER_FLUID_OUNCE,
  cup: MILLILITERS_PER_CUP,
  tbsp: MILLILITERS_PER_TABLESPOON,
  tsp: MILLILITERS_PER_TEASPOON,
};

const UNIT_LABELS: Record<string, string> = {
  serving: 'serving',
  g: 'g',
  kg: 'kg',
  oz: 'oz',
  lb: 'lb',
  ml: 'mL',
  l: 'L',
  fl_oz: 'fl oz',
  cup: 'cup',
  tbsp: 'tbsp',
  tsp: 'tsp',
};

export function getPortionUnitOptions(
  food: Pick<Food, 'servingBasis' | 'servingDescription' | 'servingSize' | 'servingUnit'>,
): PortionUnitOption[] {
  const options: PortionUnitOption[] = [];
  const canonical = getCanonicalPortion(food);
  const household = getHouseholdPortion(food);

  if (canonical.hasServing) {
    options.push({ unit: 'serving', label: 'serving' });
  }

  if (household && household.unit !== 'serving') {
    options.push({ unit: household.unit, label: household.label });
  }

  if (canonical.dimension === 'mass') {
    options.push(
      { unit: 'g', label: 'g' },
      { unit: 'oz', label: 'oz' },
      { unit: 'kg', label: 'kg' },
      { unit: 'lb', label: 'lb' },
    );
  }

  if (canonical.dimension === 'volume') {
    options.push(
      { unit: 'ml', label: 'mL' },
      { unit: 'fl_oz', label: 'fl oz' },
      { unit: 'cup', label: 'cup' },
      { unit: 'tbsp', label: 'tbsp' },
      { unit: 'tsp', label: 'tsp' },
      { unit: 'l', label: 'L' },
    );
  }

  return dedupeOptions(options);
}

export function getDefaultPortion(food: Food): { amount: number; unit: PortionUnit } {
  const options = getPortionUnitOptions(food);
  const canonical = getCanonicalPortion(food);

  if (canonical.dimension === 'mass') {
    return { amount: canonical.normalizedAmount, unit: 'g' };
  }

  if (canonical.dimension === 'volume') {
    return { amount: canonical.normalizedAmount, unit: 'ml' };
  }

  return { amount: 1, unit: options[0]?.unit ?? 'serving' };
}

export function calculatePortionNutrition({
  amount,
  food,
  itemQuantity = 1,
  unit,
}: {
  amount: number;
  food: Food;
  itemQuantity?: number;
  unit: PortionUnit;
}): PortionCalculation {
  assertPositiveAmount(amount);
  assertPositiveAmount(itemQuantity);

  const canonical = getCanonicalPortion(food);
  const normalized = normalizePortionAmount({ amount, canonical, food, unit });
  const totalNormalizedAmount = normalized.amount * itemQuantity;
  const servingEquivalent =
    canonical.normalizedAmount > 0
      ? totalNormalizedAmount / canonical.normalizedAmount
      : amount * itemQuantity;

  return {
    itemQuantity,
    portionAmount: amount,
    portionUnit: unit,
    servingEquivalent,
    normalizedAmount: totalNormalizedAmount,
    normalizedUnit: normalized.unit,
    calories: roundNutrition(food.calories * servingEquivalent),
    proteinG: roundNutrition(food.proteinG * servingEquivalent),
    carbsG: roundNutrition(food.carbsG * servingEquivalent),
    fatG: roundNutrition(food.fatG * servingEquivalent),
    fiberG: multiplyNullableNutrition(food.fiberG, servingEquivalent),
    sugarG: multiplyNullableNutrition(food.sugarG, servingEquivalent),
    sodiumMg: multiplyNullableNutrition(food.sodiumMg, servingEquivalent),
  };
}

export function calculateLogPortionNutrition({
  amount,
  itemQuantity,
  log,
  unit,
}: {
  amount: number;
  itemQuantity?: number;
  log: FoodLog;
  unit: PortionUnit;
}): PortionCalculation {
  const food = foodFromLog(log);

  return calculatePortionNutrition({ amount, food, itemQuantity, unit });
}

export function convertPortionAmount({
  amount,
  food,
  fromUnit,
  toUnit,
}: {
  amount: number;
  food: Pick<Food, 'servingBasis' | 'servingDescription' | 'servingSize' | 'servingUnit'>;
  fromUnit: PortionUnit;
  toUnit: PortionUnit;
}): number {
  assertPositiveAmount(amount);

  if (fromUnit === toUnit) {
    return amount;
  }

  const canonical = getCanonicalPortion(food);
  const normalized = normalizePortionAmount({ amount, canonical, food, unit: fromUnit });

  if (toUnit === 'serving') {
    if (!canonical.hasServing) {
      throw new UnsupportedPortionConversionError();
    }

    return normalized.amount / canonical.normalizedAmount;
  }

  const household = getHouseholdPortion(food);

  if (household?.unit === toUnit) {
    return normalized.amount / household.normalizedAmount;
  }

  if (canonical.dimension === 'mass' && isMassUnit(toUnit)) {
    return normalized.amount / MASS_FACTORS_TO_GRAMS[toUnit];
  }

  if (canonical.dimension === 'volume' && isVolumeUnit(toUnit)) {
    return normalized.amount / VOLUME_FACTORS_TO_MILLILITERS[toUnit];
  }

  throw new UnsupportedPortionConversionError();
}

export function parsePortionAmount(value: string): number | null {
  const amount = Number(value.trim());

  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function formatPortionAmount(value: number): string {
  if (value >= 100) {
    return Number(value.toFixed(1)).toString();
  }

  return Number(value.toFixed(2)).toString();
}

export function formatPortionUnit(unit: PortionUnit): string {
  return UNIT_LABELS[unit] ?? unit;
}

export function assertPositiveAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
}

function normalizePortionAmount({
  amount,
  canonical,
  food,
  unit,
}: {
  amount: number;
  canonical: CanonicalPortion;
  food: Pick<Food, 'servingBasis' | 'servingDescription' | 'servingSize' | 'servingUnit'>;
  unit: PortionUnit;
}): { amount: number; unit: 'g' | 'ml' | 'serving' } {
  if (unit === 'serving') {
    if (!canonical.hasServing) {
      throw new UnsupportedPortionConversionError();
    }

    return {
      amount: amount * canonical.normalizedAmount,
      unit: canonical.normalizedUnit,
    };
  }

  const household = getHouseholdPortion(food);

  if (household?.unit === unit) {
    return {
      amount: amount * household.normalizedAmount,
      unit: household.normalizedUnit,
    };
  }

  if (canonical.dimension === 'mass' && isMassUnit(unit)) {
    return {
      amount: amount * MASS_FACTORS_TO_GRAMS[unit],
      unit: 'g',
    };
  }

  if (canonical.dimension === 'volume' && isVolumeUnit(unit)) {
    return {
      amount: amount * VOLUME_FACTORS_TO_MILLILITERS[unit],
      unit: 'ml',
    };
  }

  throw new UnsupportedPortionConversionError();
}

type CanonicalPortion = {
  dimension: Dimension;
  hasServing: boolean;
  normalizedAmount: number;
  normalizedUnit: 'g' | 'ml' | 'serving';
};

function getCanonicalPortion(
  food: Pick<Food, 'servingBasis' | 'servingSize' | 'servingUnit'>,
): CanonicalPortion {
  const unit = normalizeUnit(food.servingUnit);

  if (food.servingBasis === 'per_100g') {
    return { dimension: 'mass', hasServing: false, normalizedAmount: 100, normalizedUnit: 'g' };
  }

  if (food.servingBasis === 'per_100ml') {
    return { dimension: 'volume', hasServing: false, normalizedAmount: 100, normalizedUnit: 'ml' };
  }

  if (food.servingSize !== null && unit && isMassUnit(unit)) {
    return {
      dimension: 'mass',
      hasServing: true,
      normalizedAmount: food.servingSize * MASS_FACTORS_TO_GRAMS[unit],
      normalizedUnit: 'g',
    };
  }

  if (food.servingSize !== null && unit && isVolumeUnit(unit)) {
    return {
      dimension: 'volume',
      hasServing: true,
      normalizedAmount: food.servingSize * VOLUME_FACTORS_TO_MILLILITERS[unit],
      normalizedUnit: 'ml',
    };
  }

  return { dimension: 'serving', hasServing: true, normalizedAmount: 1, normalizedUnit: 'serving' };
}

function getHouseholdPortion(food: Pick<Food, 'servingDescription'>): {
  unit: PortionUnit;
  label: string;
  normalizedAmount: number;
  normalizedUnit: 'g' | 'ml';
} | null {
  const description = food.servingDescription?.trim();

  if (!description) {
    return null;
  }

  const match = description.match(
    /^1\s+([a-z][a-z\s-]*?)\s*\(\s*([0-9]+(?:[.,][0-9]+)?)\s*(g|gram|grams|ml|milliliter|milliliters)\s*\)$/i,
  );

  if (!match) {
    return null;
  }

  const label = match[1].trim().toLowerCase();
  const amount = Number(match[2].replace(',', '.'));
  const unit = normalizeUnit(match[3]);

  if (!Number.isFinite(amount) || amount <= 0 || !unit) {
    return null;
  }

  if (isMassUnit(unit)) {
    return {
      unit: label,
      label,
      normalizedAmount: amount * MASS_FACTORS_TO_GRAMS[unit],
      normalizedUnit: 'g',
    };
  }

  if (isVolumeUnit(unit)) {
    return {
      unit: label,
      label,
      normalizedAmount: amount * VOLUME_FACTORS_TO_MILLILITERS[unit],
      normalizedUnit: 'ml',
    };
  }

  return null;
}

function normalizeUnit(unit: string | null): string | null {
  const normalized = unit?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'gram' || normalized === 'grams') {
    return 'g';
  }

  if (normalized === 'milliliter' || normalized === 'milliliters') {
    return 'ml';
  }

  if (normalized === 'liter' || normalized === 'liters') {
    return 'l';
  }

  if (normalized === 'fl oz' || normalized === 'fluid ounce' || normalized === 'fluid ounces') {
    return 'fl_oz';
  }

  return normalized;
}

function isMassUnit(unit: string): unit is 'g' | 'kg' | 'oz' | 'lb' {
  return unit in MASS_FACTORS_TO_GRAMS;
}

function isVolumeUnit(unit: string): unit is 'ml' | 'l' | 'fl_oz' | 'cup' | 'tbsp' | 'tsp' {
  return unit in VOLUME_FACTORS_TO_MILLILITERS;
}

function dedupeOptions(options: PortionUnitOption[]): PortionUnitOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (seen.has(option.unit)) {
      return false;
    }

    seen.add(option.unit);
    return true;
  });
}

function foodFromLog(log: FoodLog): Food {
  return {
    id: log.foodId,
    externalId: null,
    source: 'internal',
    barcode: null,
    name: log.foodName,
    brand: log.brand,
    servingSize: log.servingSize,
    servingUnit: log.servingUnit,
    servingDescription:
      log.servingSize && log.servingUnit ? `${log.servingSize} ${log.servingUnit}` : null,
    servingsPerContainer: null,
    servingBasis: log.servingSize === null ? 'unknown' : 'per_serving',
    servingCalories: log.servingCalories,
    servingProteinG: log.servingProteinG,
    servingCarbsG: log.servingCarbsG,
    servingFatG: log.servingFatG,
    servingFiberG: log.servingFiberG,
    servingSugarG: log.servingSugarG,
    servingSodiumMg: log.servingSodiumMg,
    calories: log.servingCalories,
    proteinG: log.servingProteinG,
    carbsG: log.servingCarbsG,
    fatG: log.servingFatG,
    fiberG: log.servingFiberG,
    sugarG: log.servingSugarG,
    sodiumMg: log.servingSodiumMg,
    createdBy: null,
    createdAt: log.createdAt,
    updatedAt: log.createdAt,
  };
}

function multiplyNullableNutrition(value: number | null, multiplier: number): number | null {
  return value === null ? null : roundNutrition(value * multiplier);
}

function roundNutrition(value: number): number {
  return Number(value.toFixed(2));
}
