import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

import { createOnboardingService, OnboardingSaveError } from '../onboardingService';
import type { CompleteOnboardingInput } from '../../types/onboardingTypes';

describe('createOnboardingService', () => {
  it('calls the atomic onboarding RPC with normalized profile, goal, and macro values', async () => {
    const rpc = jest.fn().mockResolvedValue({ error: null });
    const service = createOnboardingService({ rpc } as unknown as SupabaseClient<Database>);

    await expect(service.completeOnboarding(createInput())).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('complete_nutrition_onboarding', {
      p_activity_level: 'moderately_active',
      p_carbs_g: 412,
      p_current_weight_kg: 80,
      p_daily_calories: 2798,
      p_date_of_birth: '2001-06-15',
      p_fat_g: 64,
      p_goal_type: 'maintain',
      p_height_cm: 180,
      p_preferred_unit_system: 'metric',
      p_protein_g: 144,
      p_sex_for_calculation: 'male',
      p_target_weight_kg: -1,
      p_weekly_rate_kg: 0,
    });
  });

  it('throws a safe save error when Supabase rejects the RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      error: {
        code: '23514',
        message: 'constraint detail',
      },
    });
    const service = createOnboardingService({ rpc } as unknown as SupabaseClient<Database>);

    await expect(service.completeOnboarding(createInput())).rejects.toThrow(OnboardingSaveError);
    await expect(service.completeOnboarding(createInput())).rejects.toMatchObject<
      Partial<OnboardingSaveError>
    >({
      code: '23514',
    });
  });
});

function createInput(): CompleteOnboardingInput {
  return {
    userId: 'user-id',
    dateOfBirth: '2001-06-15',
    sexForCalculation: 'male',
    heightCm: 180,
    currentWeightKg: 80,
    preferredUnitSystem: 'metric',
    activityLevel: 'moderately_active',
    goalType: 'maintain',
    targetWeightKg: null,
    weeklyRateKg: null,
    plan: {
      bmr: 1805,
      tdee: 2798,
      dailyCalories: 2798,
      proteinG: 144,
      carbsG: 412,
      fatG: 64,
    },
  };
}
