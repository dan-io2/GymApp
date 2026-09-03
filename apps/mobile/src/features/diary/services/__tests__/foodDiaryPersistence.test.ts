import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

import { createFoodDiaryService } from '../foodDiaryService';
import type { Food, FoodLog } from '../../types/foodTypes';

describe('foodDiaryService persistence', () => {
  it('inserts total nutrition consumed and per-serving snapshots', async () => {
    const insert = jest.fn(() => ({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: createFoodLogRow({
              calories: 320,
              carbs_g: 72,
              protein_g: 6,
              quantity: 2,
            }),
            error: null,
          }),
      }),
    }));
    const client = {
      from: jest.fn(() => ({
        insert,
      })),
    } as unknown as SupabaseClient<Database>;

    await createFoodDiaryService(client).addLog({
      food: createRiceFood(),
      mealType: 'lunch',
      quantity: 2,
      userId: 'user-id',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        calories: 320,
        carbs_g: 72,
        fat_g: 0,
        food_id: null,
        meal_type: 'lunch',
        portion_amount: 2,
        portion_unit: 'serving',
        protein_g: 6,
        quantity: 2,
        serving_equivalent: 2,
        serving_calories: 160,
        serving_carbs_g: 36,
        serving_fat_g: 0,
        serving_protein_g: 3,
      }),
    );
  });

  it('updates quantity and meal type from per-serving values', async () => {
    const update = jest.fn(() => ({
      eq: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: createFoodLogRow({
                calories: 240,
                carbs_g: 54,
                meal_type: 'snack',
                protein_g: 4.5,
                quantity: 1.5,
              }),
              error: null,
            }),
        }),
      }),
    }));
    const client = {
      from: jest.fn(() => ({
        update,
      })),
    } as unknown as SupabaseClient<Database>;

    await createFoodDiaryService(client).updateLog({
      log: createFoodLog({
        calories: 320,
        carbsG: 72,
        proteinG: 6,
        quantity: 2,
      }),
      mealType: 'snack',
      quantity: 1.5,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        calories: 240,
        carbs_g: 54,
        fat_g: 0,
        meal_type: 'snack',
        portion_amount: 1.5,
        portion_unit: 'serving',
        protein_g: 4.5,
        quantity: 1.5,
        serving_equivalent: 1.5,
      }),
    );
  });

  it('deletes a diary log by id', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const client = {
      from: jest.fn(() => ({
        delete: () => ({
          eq,
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    await createFoodDiaryService(client).deleteLog('log-id');

    expect(eq).toHaveBeenCalledWith('id', 'log-id');
  });

  it('queries only the requested user and local day boundaries', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [createFoodLogRow()],
      error: null,
    });
    const lt = jest.fn(() => ({ order }));
    const gte = jest.fn(() => ({ lt }));
    const eq = jest.fn(() => ({ gte }));
    const client = {
      from: jest.fn(() => ({
        select: () => ({
          eq,
        }),
      })),
    } as unknown as SupabaseClient<Database>;

    await createFoodDiaryService(client).fetchLogsForLocalDate(
      'user-id',
      new Date('2026-08-10T12:00:00'),
    );

    expect(eq).toHaveBeenCalledWith('user_id', 'user-id');
    expect(gte).toHaveBeenCalledWith('logged_at', expect.any(String));
    expect(lt).toHaveBeenCalledWith('logged_at', expect.any(String));
  });
});

function createRiceFood(): Food {
  return {
    id: null,
    externalId: '0017400106959',
    source: 'open_food_facts',
    barcode: '0017400106959',
    name: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    servingSize: 45,
    servingUnit: 'g',
    servingDescription: '45 g',
    servingsPerContainer: null,
    servingBasis: 'per_serving',
    servingCalories: 160,
    servingProteinG: 3,
    servingCarbsG: 36,
    servingFatG: 0,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: 160,
    proteinG: 3,
    carbsG: 36,
    fatG: 0,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    createdBy: null,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

function createFoodLog(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'log-id',
    userId: 'user-id',
    foodId: null,
    mealType: 'lunch',
    foodName: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    quantity: 1,
    itemQuantity: overrides.itemQuantity ?? 1,
    portionAmount: overrides.portionAmount ?? 1,
    portionUnit: overrides.portionUnit ?? 'serving',
    servingEquivalent: overrides.servingEquivalent ?? 1,
    servingSize: 45,
    servingUnit: 'g',
    servingCalories: 160,
    servingProteinG: 3,
    servingCarbsG: 36,
    servingFatG: 0,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: 160,
    proteinG: 3,
    carbsG: 36,
    fatG: 0,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    loggedAt: '2026-08-10T12:00:00Z',
    createdAt: '2026-08-10T12:00:00Z',
    ...overrides,
  };
}

function createFoodLogRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'log-id',
    user_id: 'user-id',
    food_id: null,
    meal_type: 'lunch',
    food_name: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    quantity: 1,
    item_quantity: 1,
    portion_amount: 1,
    portion_unit: 'serving',
    serving_equivalent: 1,
    serving_size: 45,
    serving_unit: 'g',
    serving_calories: 160,
    serving_protein_g: 3,
    serving_carbs_g: 36,
    serving_fat_g: 0,
    serving_fiber_g: null,
    serving_sugar_g: null,
    serving_sodium_mg: null,
    calories: 160,
    protein_g: 3,
    carbs_g: 36,
    fat_g: 0,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    logged_at: '2026-08-10T12:00:00Z',
    created_at: '2026-08-10T12:00:00Z',
    ...overrides,
  };
}
