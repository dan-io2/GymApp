import type { Food } from '../../types/foodTypes';
import {
  GRAMS_PER_OUNCE,
  MILLILITERS_PER_CUP,
  MILLILITERS_PER_FLUID_OUNCE,
  MILLILITERS_PER_TABLESPOON,
  MILLILITERS_PER_TEASPOON,
  calculatePortionNutrition,
  convertPortionAmount,
  getPortionUnitOptions,
} from '../portionUtils';

const TOLERANCE = 5;

describe('portionUtils', () => {
  it('converts supported mass units to grams', () => {
    expect(
      convertPortionAmount({ amount: 1, food: createQuestFood(), fromUnit: 'kg', toUnit: 'g' }),
    ).toBeCloseTo(1000, TOLERANCE);
    expect(
      convertPortionAmount({ amount: 1, food: createQuestFood(), fromUnit: 'oz', toUnit: 'g' }),
    ).toBeCloseTo(28.349523125, TOLERANCE);
    expect(
      convertPortionAmount({ amount: 1, food: createQuestFood(), fromUnit: 'lb', toUnit: 'g' }),
    ).toBeCloseTo(453.59237, TOLERANCE);
  });

  it('converts supported volume units to milliliters', () => {
    const milk = createMilkFood();

    expect(
      convertPortionAmount({ amount: 1, food: milk, fromUnit: 'l', toUnit: 'ml' }),
    ).toBeCloseTo(1000, TOLERANCE);
    expect(
      convertPortionAmount({ amount: 1, food: milk, fromUnit: 'fl_oz', toUnit: 'ml' }),
    ).toBeCloseTo(MILLILITERS_PER_FLUID_OUNCE, TOLERANCE);
    expect(
      convertPortionAmount({ amount: 1, food: milk, fromUnit: 'cup', toUnit: 'ml' }),
    ).toBeCloseTo(MILLILITERS_PER_CUP, TOLERANCE);
    expect(
      convertPortionAmount({ amount: 1, food: milk, fromUnit: 'tbsp', toUnit: 'ml' }),
    ).toBeCloseTo(MILLILITERS_PER_TABLESPOON, TOLERANCE);
    expect(
      convertPortionAmount({ amount: 1, food: milk, fromUnit: 'tsp', toUnit: 'ml' }),
    ).toBeCloseTo(MILLILITERS_PER_TEASPOON, TOLERANCE);
  });

  it('keeps Quest serving, gram, and ounce entries equivalent', () => {
    const food = createQuestFood();
    const oneServing = calculatePortionNutrition({ amount: 1, food, unit: 'serving' });
    const grams = calculatePortionNutrition({ amount: 32, food, unit: 'g' });
    const ounces = calculatePortionNutrition({ amount: 32 / GRAMS_PER_OUNCE, food, unit: 'oz' });

    expect(oneServing).toMatchObject({ calories: 140, proteinG: 20, carbsG: 4, fatG: 4.5 });
    expect(grams.calories).toBeCloseTo(oneServing.calories, TOLERANCE);
    expect(ounces.proteinG).toBeCloseTo(oneServing.proteinG, TOLERANCE);
    expect(calculatePortionNutrition({ amount: 0.5, food, unit: 'serving' }).calories).toBe(70);
    expect(calculatePortionNutrition({ amount: 2, food, unit: 'serving' }).proteinG).toBe(40);
  });

  it('calculates the Quest 50g regression exactly from serving basis', () => {
    const portion = calculatePortionNutrition({ amount: 50, food: createQuestFood(), unit: 'g' });

    expect(portion.servingEquivalent).toBeCloseTo(1.5625, TOLERANCE);
    expect(portion.calories).toBeCloseTo(218.75, TOLERANCE);
    expect(portion.proteinG).toBeCloseTo(31.25, TOLERANCE);
    expect(portion.carbsG).toBeCloseTo(6.25, TOLERANCE);
    expect(portion.fatG).toBeCloseTo(7.03, 2);
  });

  it('preserves nutrition when switching Quest grams to ounces and back', () => {
    const food = createQuestFood();
    const ounces = convertPortionAmount({ amount: 32, food, fromUnit: 'g', toUnit: 'oz' });
    const grams = convertPortionAmount({ amount: ounces, food, fromUnit: 'oz', toUnit: 'g' });

    expect(ounces).toBeCloseTo(1.12877, 4);
    expect(grams).toBeCloseTo(32, TOLERANCE);
    expect(calculatePortionNutrition({ amount: ounces, food, unit: 'oz' }).calories).toBeCloseTo(
      140,
      TOLERANCE,
    );
  });

  it('keeps Mahatma rice serving and ounce conversions stable', () => {
    const food = createRiceFood();

    expect(calculatePortionNutrition({ amount: 1, food, unit: 'serving' })).toMatchObject({
      calories: 160,
      proteinG: 3,
      carbsG: 36,
      fatG: 0,
    });
    expect(calculatePortionNutrition({ amount: 0.5, food, unit: 'serving' }).calories).toBe(80);
    expect(calculatePortionNutrition({ amount: 90, food, unit: 'g' }).carbsG).toBe(72);
    expect(
      calculatePortionNutrition({ amount: 45 / GRAMS_PER_OUNCE, food, unit: 'oz' }).calories,
    ).toBeCloseTo(160, TOLERANCE);
  });

  it('supports liquid mL, cup, fl oz, tbsp, and tsp without exposing mass units', () => {
    const milk = createMilkFood();
    const units = getPortionUnitOptions(milk).map((option) => option.unit);

    expect(units).toEqual(['serving', 'ml', 'fl_oz', 'cup', 'tbsp', 'tsp', 'l']);
    expect(units).not.toContain('g');
    expect(calculatePortionNutrition({ amount: 240, food: milk, unit: 'ml' }).calories).toBe(150);
    expect(calculatePortionNutrition({ amount: 120, food: milk, unit: 'ml' }).proteinG).toBe(4);
    expect(calculatePortionNutrition({ amount: 480, food: milk, unit: 'ml' }).fatG).toBe(16);
    expect(calculatePortionNutrition({ amount: 1, food: milk, unit: 'cup' }).calories).toBeCloseTo(
      147.87,
      2,
    );
    expect(
      calculatePortionNutrition({
        amount: 240 / MILLILITERS_PER_FLUID_OUNCE,
        food: milk,
        unit: 'fl_oz',
      }).carbsG,
    ).toBeCloseTo(12, TOLERANCE);
  });

  it('supports provider-defined discrete household portions only when present', () => {
    const bar = createProteinBarFood();
    const units = getPortionUnitOptions(bar).map((option) => option.unit);

    expect(units).toEqual(['serving', 'bar', 'g', 'oz', 'kg', 'lb']);
    expect(units).not.toContain('cup');
    expect(
      calculatePortionNutrition({ amount: 0.5, food: bar, unit: 'bar' }).normalizedAmount,
    ).toBe(30);
    expect(calculatePortionNutrition({ amount: 2, food: bar, unit: 'bar' }).normalizedAmount).toBe(
      120,
    );
  });

  it.each([
    ['Chicken Breast', 174, 'breast', 1, 174],
    ['Chicken Breast', 174, 'breast', 2, 348],
    ['Chicken Breast', 174, 'breast', 3, 522],
    ['Eggs', 50, 'egg', 6, 300],
    ['Protein Bar', 60, 'bar', 3, 180],
    ['Banana', 118, 'banana', 3, 354],
  ])('logs countable %s quantity %s as total amount', (name, grams, unit, itemQuantity, total) => {
    const portion = calculatePortionNutrition({
      amount: 1,
      food: createFood({
        name,
        servingSize: grams,
        servingUnit: 'g',
        servingDescription: `1 ${unit} (${grams} g)`,
        calories: 100,
        proteinG: 10,
        carbsG: 5,
        fatG: 2,
      }),
      itemQuantity,
      unit,
    });

    expect(portion.normalizedAmount).toBe(total);
    expect(portion.calories).toBe(100 * itemQuantity);
    expect(portion.proteinG).toBe(10 * itemQuantity);
  });

  it('logs packaged servings with item quantity without creating multiple rows', () => {
    const portion = calculatePortionNutrition({
      amount: 1,
      food: createQuestFood(),
      itemQuantity: 8,
      unit: 'serving',
    });

    expect(portion.normalizedAmount).toBe(256);
    expect(portion.calories).toBe(1120);
    expect(portion.proteinG).toBe(160);
  });

  it('uses per-100g products without inventing a serving option', () => {
    const food = createPer100gFood();
    const units = getPortionUnitOptions(food).map((option) => option.unit);

    expect(units).toEqual(['g', 'oz', 'kg', 'lb']);
    expect(calculatePortionNutrition({ amount: 50, food, unit: 'g' })).toMatchObject({
      calories: 125,
      proteinG: 5,
      carbsG: 10,
      fatG: 4,
    });
    expect(() => calculatePortionNutrition({ amount: 1, food, unit: 'serving' })).toThrow(
      'Portion conversion is unsupported for this food.',
    );
  });

  it('rejects invalid amounts', () => {
    expect(() =>
      calculatePortionNutrition({ amount: 0, food: createQuestFood(), unit: 'g' }),
    ).toThrow('Amount must be greater than zero.');
    expect(() =>
      calculatePortionNutrition({ amount: -1, food: createQuestFood(), unit: 'g' }),
    ).toThrow('Amount must be greater than zero.');
    expect(() =>
      calculatePortionNutrition({ amount: Number.NaN, food: createQuestFood(), unit: 'g' }),
    ).toThrow('Amount must be greater than zero.');
  });

  it.each([0.25, 0.5, 1, 1.25, 1.5, 2, 2.75, 3])(
    'scales serving quantity %s linearly',
    (amount) => {
      const portion = calculatePortionNutrition({
        amount,
        food: createQuestFood(),
        unit: 'serving',
      });

      expect(portion.calories).toBeCloseTo(140 * amount, TOLERANCE);
      expect(portion.proteinG).toBeCloseTo(20 * amount, TOLERANCE);
      expect(portion.carbsG).toBeCloseTo(4 * amount, TOLERANCE);
      expect(portion.fatG).toBeCloseTo(4.5 * amount, 1);
    },
  );

  it.each([10, 25, 32, 50, 100, 250])('scales gram amount %s linearly', (amount) => {
    const servingEquivalent = amount / 32;
    const portion = calculatePortionNutrition({ amount, food: createQuestFood(), unit: 'g' });

    expect(portion.calories).toBeCloseTo(140 * servingEquivalent, 1);
  });
});

function createQuestFood(): Food {
  return createFood({
    name: 'Protein Chips',
    brand: 'Quest Nutrition',
    servingSize: 32,
    servingUnit: 'g',
    servingDescription: '32 g',
    servingsPerContainer: 8,
    calories: 140,
    proteinG: 20,
    carbsG: 4,
    fatG: 4.5,
    fiberG: 1,
    sugarG: 1,
    sodiumMg: 320,
  });
}

function createRiceFood(): Food {
  return createFood({
    name: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    servingSize: 45,
    servingUnit: 'g',
    servingDescription: '45 g',
    calories: 160,
    proteinG: 3,
    carbsG: 36,
    fatG: 0,
  });
}

function createMilkFood(): Food {
  return createFood({
    name: 'Milk',
    servingSize: 240,
    servingUnit: 'ml',
    servingDescription: '240 mL',
    calories: 150,
    proteinG: 8,
    carbsG: 12,
    fatG: 8,
  });
}

function createProteinBarFood(): Food {
  return createFood({
    name: 'Protein Bar',
    servingSize: 60,
    servingUnit: 'g',
    servingDescription: '1 bar (60 g)',
    calories: 220,
    proteinG: 20,
    carbsG: 24,
    fatG: 7,
  });
}

function createPer100gFood(): Food {
  return createFood({
    name: 'Per 100g Food',
    servingSize: null,
    servingUnit: null,
    servingDescription: null,
    servingBasis: 'per_100g',
    calories: 250,
    proteinG: 10,
    carbsG: 20,
    fatG: 8,
  });
}

function createFood(overrides: Partial<Food> = {}): Food {
  const calories = overrides.calories ?? 100;
  const proteinG = overrides.proteinG ?? 10;
  const carbsG = overrides.carbsG ?? 10;
  const fatG = overrides.fatG ?? 2;

  return {
    id: null,
    externalId: 'fixture',
    source: 'open_food_facts',
    barcode: null,
    name: 'Fixture Food',
    brand: null,
    servingSize: 1,
    servingUnit: 'g',
    servingDescription: '1 g',
    servingsPerContainer: null,
    servingBasis: 'per_serving',
    servingCalories: calories,
    servingProteinG: proteinG,
    servingCarbsG: carbsG,
    servingFatG: fatG,
    servingFiberG: overrides.fiberG ?? null,
    servingSugarG: overrides.sugarG ?? null,
    servingSodiumMg: overrides.sodiumMg ?? null,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    createdBy: null,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
    ...overrides,
  };
}
