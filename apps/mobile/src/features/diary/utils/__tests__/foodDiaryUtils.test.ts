import type { Food, FoodLog } from '../../types/foodTypes';
import {
  aggregateDailyNutrition,
  assertValidMealType,
  calculateFoodLogSnapshot,
  calculateNutritionProgress,
  calculateRemainingNutrition,
  filterLogsForLocalDate,
  getLocalDayRange,
  isValidMealType,
} from '../foodDiaryUtils';

describe('foodDiaryUtils', () => {
  it('supports a valid normalized Food model without a barcode', () => {
    const food = createFood({
      barcode: null,
      source: 'usda',
      externalId: '2646170',
    });

    expect(food.barcode).toBeNull();
    expect(food.source).toBe('usda');
    expect(food.externalId).toBe('2646170');
  });

  it('represents Open Food Facts barcode identity separately from provider id', () => {
    expect({
      type: 'barcode',
      barcode: '012345678905',
    }).toEqual({
      type: 'barcode',
      barcode: '012345678905',
    });
    expect({
      type: 'provider',
      source: 'open_food_facts',
      externalId: '012345678905',
    }).toEqual({
      type: 'provider',
      source: 'open_food_facts',
      externalId: '012345678905',
    });
  });

  it('represents USDA provider identifiers without treating them as barcodes', () => {
    expect({
      type: 'provider',
      source: 'usda',
      externalId: '2646170',
    }).toEqual({
      type: 'provider',
      source: 'usda',
      externalId: '2646170',
    });
  });

  it('validates meal types', () => {
    expect(isValidMealType('breakfast')).toBe(true);
    expect(isValidMealType('lunch')).toBe(true);
    expect(isValidMealType('dinner')).toBe(true);
    expect(isValidMealType('snack')).toBe(true);
    expect(() => assertValidMealType('brunch')).toThrow('Meal type is invalid.');
  });

  it('calculates one, two, and fractional serving snapshots', () => {
    const food = createFood();

    expect(
      calculateFoodLogSnapshot({ food, mealType: 'lunch', quantity: 1, userId: 'user-id' }),
    ).toMatchObject({
      calories: 150,
      proteinG: 30,
    });
    expect(
      calculateFoodLogSnapshot({ food, mealType: 'lunch', quantity: 2, userId: 'user-id' }),
    ).toMatchObject({
      quantity: 2,
      calories: 300,
      proteinG: 60,
    });
    expect(
      calculateFoodLogSnapshot({ food, mealType: 'lunch', quantity: 0.5, userId: 'user-id' }),
    ).toMatchObject({
      quantity: 0.5,
      calories: 75,
      proteinG: 15,
    });
  });

  it('rejects zero or negative quantity', () => {
    expect(() =>
      calculateFoodLogSnapshot({
        food: createFood(),
        mealType: 'snack',
        quantity: 0,
        userId: 'user-id',
      }),
    ).toThrow('Amount must be greater than zero.');
  });

  it('snapshots nutrition so future food changes do not alter log totals', () => {
    const food = createFood({ calories: 150 });
    const log = calculateFoodLogSnapshot({
      food,
      mealType: 'snack',
      quantity: 2,
      userId: 'user-id',
    });

    food.calories = 200;

    expect(log.calories).toBe(300);
  });

  it('aggregates daily calories, protein, carbs, and fat', () => {
    expect(
      aggregateDailyNutrition([createLog(), createLog({ calories: 75, proteinG: 15 })]),
    ).toEqual({
      caloriesConsumed: 225,
      proteinConsumedG: 45,
      carbsConsumedG: 10,
      fatConsumedG: 4,
    });
  });

  it('excludes logs from another local date', () => {
    const logs = [
      createLog({ loggedAt: '2026-08-10T12:00:00.000Z' }),
      createLog({ loggedAt: '2026-08-11T12:00:00.000Z' }),
    ];

    expect(filterLogsForLocalDate(logs, new Date('2026-08-10T09:00:00'))).toHaveLength(1);
  });

  it('creates local day range timestamps', () => {
    const range = getLocalDayRange(new Date('2026-08-10T13:45:00'));

    expect(Date.parse(range.end)).toBeGreaterThan(Date.parse(range.start));
  });

  it('calculates remaining targets while preserving overage values', () => {
    expect(
      calculateRemainingNutrition(
        {
          dailyCalories: 2000,
          proteinG: 180,
          carbsG: 220,
          fatG: 70,
        },
        {
          caloriesConsumed: 2100,
          proteinConsumedG: 120,
          carbsConsumedG: 230,
          fatConsumedG: 40,
        },
      ),
    ).toEqual({
      caloriesRemaining: 0,
      proteinRemainingG: 60,
      carbsRemainingG: 0,
      fatRemainingG: 30,
      caloriesOverage: 100,
      proteinOverageG: 0,
      carbsOverageG: 10,
      fatOverageG: 0,
    });
  });

  it('clamps progress visuals while retaining a true over-target ratio', () => {
    const progress = calculateNutritionProgress(
      { dailyCalories: 2000, proteinG: 100, carbsG: 100, fatG: 50 },
      { caloriesConsumed: 2500, proteinConsumedG: 125, carbsConsumedG: 50, fatConsumedG: 25 },
    );

    expect(progress.calories.progressRatio).toBe(1);
    expect(progress.calories.percentage).toBe(125);
    expect(progress.protein.progressRatio).toBe(1);
    expect(progress.protein.percentage).toBe(125);
  });
});

function createFood(overrides: Partial<Food> = {}): Food {
  return {
    id: 'food-id',
    externalId: null,
    source: 'user',
    barcode: '012345678905',
    name: 'Protein shake',
    brand: 'GymApp Test',
    servingSize: 1,
    servingUnit: 'bottle',
    servingDescription: '1 bottle',
    servingsPerContainer: null,
    servingBasis: 'per_serving',
    servingCalories: 150,
    servingProteinG: 30,
    servingCarbsG: 5,
    servingFatG: 2,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: 150,
    proteinG: 30,
    carbsG: 5,
    fatG: 2,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    createdBy: 'user-id',
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
    ...overrides,
  };
}

function createLog(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'log-id',
    userId: 'user-id',
    foodId: 'food-id',
    mealType: 'lunch',
    foodName: 'Protein shake',
    brand: 'GymApp Test',
    quantity: 1,
    itemQuantity: overrides.itemQuantity ?? 1,
    portionAmount: overrides.portionAmount ?? 1,
    portionUnit: overrides.portionUnit ?? 'serving',
    servingEquivalent: overrides.servingEquivalent ?? 1,
    servingSize: 1,
    servingUnit: 'bottle',
    servingCalories: 150,
    servingProteinG: 30,
    servingCarbsG: 5,
    servingFatG: 2,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: 150,
    proteinG: 30,
    carbsG: 5,
    fatG: 2,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    loggedAt: '2026-08-10T12:00:00.000Z',
    createdAt: '2026-08-10T12:00:00.000Z',
    ...overrides,
  };
}
