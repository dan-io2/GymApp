import { createManualFoodService, validateManualFood } from '../manualFoodService';
import { mapFoodSearchResultToFood } from '@/features/food-search/utils/foodSearchMapping';
import { calculateFoodLogSnapshot } from '@/features/diary/utils/foodDiaryUtils';

describe('manual food service', () => {
  it('creates a stable user-source food identity with per-serving nutrition', async () => {
    const single = jest.fn().mockResolvedValue({ data: foodRow(), error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const client = { from: jest.fn(() => ({ insert })) } as never;
    const food = await createManualFoodService(client).create('user-id', validInput());
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'user', created_by: 'user-id' }),
    );
    expect(food).toMatchObject({
      id: 'food-id',
      source: 'user',
      externalId: 'manual:user-id:stable',
      servingBasis: 'per_serving',
    });

    const snapshot = calculateFoodLogSnapshot({
      food: mapFoodSearchResultToFood(food),
      mealType: 'breakfast',
      quantity: 0.5,
      userId: 'user-id',
    });
    expect(snapshot).toMatchObject({ foodId: 'food-id', calories: 90, proteinG: 3 });
  });

  it('accepts fractional serving amounts and rejects invalid nutrition', () => {
    expect(validateManualFood(validInput({ servingAmount: 0.5 })).servingAmount).toBe(0.5);
    expect(() => validateManualFood(validInput({ calories: -1 }))).toThrow('Nutrition values');
  });
});

function validInput(overrides = {}) {
  return {
    name: 'Homemade oats',
    servingAmount: 0.5,
    servingUnit: 'cup',
    calories: 180,
    proteinG: 6,
    carbsG: 32,
    fatG: 4,
    ...overrides,
  };
}

function foodRow() {
  return {
    id: 'food-id',
    external_id: 'manual:user-id:stable',
    name: 'Homemade oats',
    serving_size: 0.5,
    serving_unit: 'cup',
    calories: 180,
    protein_g: 6,
    carbs_g: 32,
    fat_g: 4,
  };
}
