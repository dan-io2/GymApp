import type { SupabaseClient } from '@supabase/supabase-js';

import { createSavedMealService } from '../savedMealService';
import type { Database } from '@/types/database';

function createClient(rpc: jest.Mock): SupabaseClient<Database> {
  return { rpc } as unknown as SupabaseClient<Database>;
}

describe('savedMealService.logSavedMeal', () => {
  it.each([0.5, 1, 2] as const)(
    'sends the supported %sx multiplier to the atomic RPC',
    async (multiplier) => {
      const rpc = jest.fn().mockResolvedValue({ data: [], error: null });
      const service = createSavedMealService(createClient(rpc));

      await expect(
        service.logSavedMeal({ mealId: 'meal-id', mealType: 'lunch', multiplier }),
      ).resolves.toEqual([]);

      expect(rpc).toHaveBeenCalledWith('log_saved_meal', {
        p_meal_type: 'lunch',
        p_multiplier: multiplier,
        p_saved_meal_id: 'meal-id',
      });
    },
  );

  it('preserves the user-facing error while logging safe RPC diagnostics in development', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'new row violates row-level security policy' },
    });
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const service = createSavedMealService(createClient(rpc));

    await expect(
      service.logSavedMeal({ mealId: 'meal-id', mealType: 'lunch', multiplier: 1 }),
    ).rejects.toThrow("We couldn't log this saved meal. Please try again.");

    expect(consoleSpy).toHaveBeenCalledWith('[GymApp saved meal rpc]', {
      code: '42501',
      message: 'new row violates row-level security policy',
      operation: 'log_saved_meal',
    });
    consoleSpy.mockRestore();
  });
});
