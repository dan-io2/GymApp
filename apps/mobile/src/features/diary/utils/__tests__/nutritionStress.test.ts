import type { Food, FoodSource } from '../../types/foodTypes';
import { aggregateDailyNutrition, calculateFoodLogSnapshot } from '../foodDiaryUtils';
import { calculatePortionNutrition, convertPortionAmount, GRAMS_PER_OUNCE } from '../portionUtils';

type Nutrition = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type StressCase = {
  name: string;
  source: FoodSource;
  food: Food;
  amount: number;
  unit: string;
  expected: Nutrition;
};

const stressCases: StressCase[] = [
  createMassCase('Chicken breast 100g', 'usda', 100, 165, 31, 0, 3.6, 165, 31, 0, 3.6),
  createMassCase('Chicken breast 150g', 'usda', 150, 165, 31, 0, 3.6, 247.5, 46.5, 0, 5.4),
  createServingCase('Banana 1 serving', 'usda', 118, 105, 1.3, 27, 0.4, 1, 105, 1.3, 27, 0.4),
  createServingCase('Banana 2 servings', 'usda', 118, 105, 1.3, 27, 0.4, 2, 210, 2.6, 54, 0.8),
  createServingCase('Large egg 1 serving', 'usda', 50, 72, 6.3, 0.4, 4.8, 1, 72, 6.3, 0.4, 4.8),
  createServingCase('Large egg 2 servings', 'usda', 50, 72, 6.3, 0.4, 4.8, 2, 144, 12.6, 0.8, 9.6),
  createMassCase('Cooked white rice 100g', 'usda', 100, 130, 2.7, 28.2, 0.3, 130, 2.7, 28.2, 0.3),
  createMassCase('Cooked white rice 200g', 'usda', 200, 130, 2.7, 28.2, 0.3, 260, 5.4, 56.4, 0.6),
  createMassCase('Broccoli 50g', 'usda', 50, 35, 2.4, 7.2, 0.4, 17.5, 1.2, 3.6, 0.2),
  createMassCase('Broccoli 150g', 'usda', 150, 35, 2.4, 7.2, 0.4, 52.5, 3.6, 10.8, 0.6),
  createServingCase(
    'Black beans 1 serving',
    'usda',
    172,
    227,
    15.2,
    40.8,
    0.9,
    1,
    227,
    15.2,
    40.8,
    0.9,
  ),
  createServingCase(
    'Black beans 2 servings',
    'usda',
    172,
    227,
    15.2,
    40.8,
    0.9,
    2,
    454,
    30.4,
    81.6,
    1.8,
  ),
  createMassCase('Oats 40g', 'usda', 40, 389, 16.9, 66.3, 6.9, 155.6, 6.76, 26.52, 2.76),
  createMassCase('Oats 80g', 'usda', 80, 389, 16.9, 66.3, 6.9, 311.2, 13.52, 53.04, 5.52),
  createMassCase('Salmon 100g', 'usda', 100, 208, 20.4, 0, 13.4, 208, 20.4, 0, 13.4),
  createMassCase('Avocado 50g', 'usda', 50, 160, 2, 8.5, 14.7, 80, 1, 4.25, 7.35),
  createMassCase('Greek yogurt 170g', 'usda', 170, 59, 10.3, 3.6, 0.4, 100.3, 17.51, 6.12, 0.68),
  createMassCase('Greek yogurt 340g', 'usda', 340, 59, 10.3, 3.6, 0.4, 200.6, 35.02, 12.24, 1.36),
  createServingCase(
    'Chipotle chicken 1 serving',
    'fatsecret',
    113,
    180,
    32,
    0,
    7,
    1,
    180,
    32,
    0,
    7,
  ),
  createServingCase(
    'Chipotle chicken 1 oz',
    'fatsecret',
    GRAMS_PER_OUNCE,
    45,
    8,
    0,
    2,
    1,
    45,
    8,
    0,
    2,
  ),
  createMassCase('Chipotle chicken 100g', 'fatsecret', 100, 159, 28.3, 0, 6.2, 159, 28.3, 0, 6.2),
  createServingCase("McDonald's Big Mac", 'fatsecret', 219, 563, 26, 45, 33, 1, 563, 26, 45, 33),
  createServingCase('Chick-fil-A nuggets', 'fatsecret', 140, 250, 25, 11, 11, 1, 250, 25, 11, 11),
  createServingCase('Starbucks latte', 'fatsecret', 473, 190, 13, 18, 7, 1, 190, 13, 18, 7),
  createMassCase(
    'Quest protein chips 32g',
    'open_food_facts',
    32,
    437.5,
    62.5,
    12.5,
    14.0625,
    140,
    20,
    4,
    4.5,
  ),
  createMassCase(
    'Quest protein chips 64g',
    'open_food_facts',
    64,
    437.5,
    62.5,
    12.5,
    14.0625,
    280,
    40,
    8,
    9,
  ),
  createServingCase('Mahatma rice 45g', 'open_food_facts', 45, 160, 3, 36, 0, 1, 160, 3, 36, 0),
  createMassCase(
    'Incomplete low-calorie product 1g',
    'open_food_facts',
    1,
    2,
    0.1,
    0.2,
    0,
    0.02,
    0.001,
    0.002,
    0,
  ),
  createServingCase(
    'Ounce-labeled packaged snack',
    'open_food_facts',
    GRAMS_PER_OUNCE,
    57,
    2,
    8,
    2,
    1,
    57,
    2,
    8,
    2,
  ),
  createVolumeCase('Milk volume 100ml', 'usda', 100, 42, 3.4, 5, 1, 42, 3.4, 5, 1),
];

describe('real-world nutrition stress matrix', () => {
  it('scales independent known-answer cases across all providers', () => {
    expect(stressCases).toHaveLength(30);

    for (const testCase of stressCases) {
      const actual = calculatePortionNutrition({
        amount: testCase.amount,
        food: testCase.food,
        unit: testCase.unit,
      });

      expect(actual.calories).toBeCloseTo(testCase.expected.calories, 8);
      expect(actual.proteinG).toBeCloseTo(testCase.expected.proteinG, 8);
      expect(actual.carbsG).toBeCloseTo(testCase.expected.carbsG, 8);
      expect(actual.fatG).toBeCloseTo(testCase.expected.fatG, 8);
      expect(Number.isFinite(actual.calories)).toBe(true);
      expect(testCase.food.source).toBe(testCase.source);
    }
  });

  it('scales fractional and extreme serving quantities linearly', () => {
    const food = createFood('Serving stress food', 'usda', 1, 'serving', 'per_serving', {
      calories: 200,
      proteinG: 20,
      carbsG: 30,
      fatG: 5,
    });

    for (const amount of [0.01, 0.1, 0.25, 0.5, 1, 1.5, 2, 2.25, 3, 10]) {
      const actual = calculatePortionNutrition({ amount, food, unit: 'serving' });
      expect(actual.calories).toBeCloseTo(200 * amount, 8);
      expect(actual.proteinG).toBeCloseTo(20 * amount, 8);
      expect(actual.carbsG).toBeCloseTo(30 * amount, 8);
      expect(actual.fatG).toBeCloseTo(5 * amount, 8);
    }
  });

  it('matches ounce and gram portions without treating ounces as grams', () => {
    const food = createFood('Chicken conversion food', 'usda', null, null, 'per_100g', {
      calories: 165,
      proteinG: 31,
      carbsG: 0,
      fatG: 3.6,
    });
    const ounce = calculatePortionNutrition({ amount: 1, food, unit: 'oz' });
    const grams = calculatePortionNutrition({ amount: GRAMS_PER_OUNCE, food, unit: 'g' });

    expect(ounce.calories).toBeCloseTo(grams.calories, 8);
    expect(ounce.proteinG).toBeCloseTo(grams.proteinG, 8);
    expect(ounce.fatG).toBeCloseTo(grams.fatG, 8);
    expect(convertPortionAmount({ amount: 1, food, fromUnit: 'oz', toUnit: 'g' })).toBeCloseTo(
      GRAMS_PER_OUNCE,
      8,
    );
    expect(convertPortionAmount({ amount: 4, food, fromUnit: 'oz', toUnit: 'g' })).toBeCloseTo(
      4 * GRAMS_PER_OUNCE,
      8,
    );
  });

  it('rejects unsupported volume-to-mass conversion', () => {
    const milk = createFood('Milk', 'usda', 100, 'ml', 'per_serving', {
      calories: 42,
      proteinG: 3.4,
      carbsG: 5,
      fatG: 1,
    });

    expect(() => calculatePortionNutrition({ amount: 1, food: milk, unit: 'g' })).toThrow(
      'Portion conversion is unsupported',
    );
  });

  it('preserves detail nutrition in diary snapshots and aggregates a mixed-provider day once', () => {
    const logs = stressCases.slice(0, 3).map((testCase, index) =>
      calculateFoodLogSnapshot({
        food: testCase.food,
        mealType: index === 0 ? 'breakfast' : 'lunch',
        quantity: testCase.amount,
        portionAmount: testCase.amount,
        portionUnit: testCase.unit,
        userId: 'stress-test-user',
      }),
    );
    const totals = aggregateDailyNutrition(
      logs.map((log, index) => ({ ...log, id: `log-${index}`, createdAt: log.loggedAt })),
    );

    expect(logs[0].calories).toBeCloseTo(165, 8);
    expect(logs[1].proteinG).toBeCloseTo(46.5, 8);
    expect(totals.caloriesConsumed).toBeCloseTo(165 + 247.5 + 105, 8);
    expect(totals.proteinConsumedG).toBeCloseTo(31 + 46.5 + 1.3, 8);
    expect(totals.carbsConsumedG).toBeCloseTo(0 + 0 + 27, 8);
    expect(totals.fatConsumedG).toBeCloseTo(3.6 + 5.4 + 0.4, 8);
  });
});

function createMassCase(
  name: string,
  source: FoodSource,
  amount: number,
  caloriesPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
): StressCase {
  return {
    name,
    source,
    food: createFood(name, source, null, null, 'per_100g', {
      calories: caloriesPer100g,
      proteinG: proteinPer100g,
      carbsG: carbsPer100g,
      fatG: fatPer100g,
    }),
    amount,
    unit: 'g',
    expected: { calories, proteinG, carbsG, fatG },
  };
}

function createServingCase(
  name: string,
  source: FoodSource,
  servingSize: number,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  amount: number,
  expectedCalories: number,
  expectedProteinG: number,
  expectedCarbsG: number,
  expectedFatG: number,
): StressCase {
  return {
    name,
    source,
    food: createFood(name, source, servingSize, 'g', 'per_serving', {
      calories,
      proteinG,
      carbsG,
      fatG,
    }),
    amount,
    unit: 'serving',
    expected: {
      calories: expectedCalories,
      proteinG: expectedProteinG,
      carbsG: expectedCarbsG,
      fatG: expectedFatG,
    },
  };
}

function createVolumeCase(
  name: string,
  source: FoodSource,
  amount: number,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  expectedCalories: number,
  expectedProteinG: number,
  expectedCarbsG: number,
  expectedFatG: number,
): StressCase {
  return {
    name,
    source,
    food: createFood(name, source, 100, 'ml', 'per_serving', {
      calories,
      proteinG,
      carbsG,
      fatG,
    }),
    amount,
    unit: 'ml',
    expected: {
      calories: expectedCalories,
      proteinG: expectedProteinG,
      carbsG: expectedCarbsG,
      fatG: expectedFatG,
    },
  };
}

function createFood(
  name: string,
  source: FoodSource,
  servingSize: number | null,
  servingUnit: string | null,
  servingBasis: Food['servingBasis'],
  nutrition: Nutrition,
): Food {
  return {
    id: null,
    externalId: `${source}-${name.toLowerCase().replaceAll(' ', '-')}`,
    source,
    barcode: source === 'open_food_facts' ? 'stress-barcode' : null,
    name,
    brand:
      source === 'usda' ? null : source === 'fatsecret' ? 'Restaurant fixture' : 'Packaged fixture',
    servingSize,
    servingUnit,
    servingDescription: servingSize === null ? null : `${servingSize} ${servingUnit}`,
    servingsPerContainer: null,
    servingBasis,
    servingCalories: nutrition.calories,
    servingProteinG: nutrition.proteinG,
    servingCarbsG: nutrition.carbsG,
    servingFatG: nutrition.fatG,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    createdBy: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}
