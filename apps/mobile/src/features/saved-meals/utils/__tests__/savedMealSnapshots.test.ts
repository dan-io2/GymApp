import type { FoodLog } from '@/features/diary/types/foodTypes';

import {
  createSavedMealItemInsert,
  isValidSavedMealName,
  normalizeSavedMealName,
} from '../savedMealSnapshots';

describe('savedMealSnapshots', () => {
  it('normalizes and validates saved meal names', () => {
    expect(normalizeSavedMealName('  Post   Workout  ')).toBe('Post Workout');
    expect(isValidSavedMealName('Post Workout')).toBe(true);
    expect(isValidSavedMealName('   ')).toBe(false);
    expect(isValidSavedMealName('x'.repeat(81))).toBe(false);
  });

  it('creates saved meal item inserts from immutable food log snapshots', () => {
    const insert = createSavedMealItemInsert(createLog(), 'meal-id', 2);

    expect(insert).toEqual(
      expect.objectContaining({
        calories: 320,
        food_id: 'food-id',
        food_name: 'Chicken Bowl',
        item_quantity: 2,
        portion_amount: 1,
        portion_unit: 'serving',
        protein_g: 42,
        saved_meal_id: 'meal-id',
        serving_calories: 160,
        serving_equivalent: 2,
        sort_order: 2,
      }),
    );
  });
});

function createLog(): FoodLog {
  return {
    id: 'log-id',
    userId: 'user-id',
    foodId: 'food-id',
    mealType: 'lunch',
    foodName: 'Chicken Bowl',
    brand: 'Gym Kitchen',
    quantity: 2,
    itemQuantity: 2,
    portionAmount: 1,
    portionUnit: 'serving',
    servingEquivalent: 2,
    servingSize: 250,
    servingUnit: 'g',
    servingCalories: 160,
    servingProteinG: 21,
    servingCarbsG: 15,
    servingFatG: 4,
    servingFiberG: 3,
    servingSugarG: 2,
    servingSodiumMg: 400,
    calories: 320,
    proteinG: 42,
    carbsG: 30,
    fatG: 8,
    fiberG: 6,
    sugarG: 4,
    sodiumMg: 800,
    loggedAt: '2026-08-19T12:00:00Z',
    createdAt: '2026-08-19T12:00:00Z',
  };
}
