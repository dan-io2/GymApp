import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { CompleteOnboardingInput } from '../types/onboardingTypes';

export class OnboardingSaveError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'OnboardingSaveError';
  }
}

export type OnboardingService = {
  completeOnboarding: (input: CompleteOnboardingInput) => Promise<void>;
};

export function createOnboardingService(client: SupabaseClient<Database>): OnboardingService {
  return {
    async completeOnboarding(input) {
      const { error } = await client.rpc('complete_nutrition_onboarding', {
        p_activity_level: input.activityLevel,
        p_carbs_g: input.plan.carbsG,
        p_current_weight_kg: input.currentWeightKg,
        p_daily_calories: input.plan.dailyCalories,
        p_date_of_birth: input.dateOfBirth,
        p_fat_g: input.plan.fatG,
        p_goal_type: input.goalType,
        p_height_cm: input.heightCm,
        p_preferred_unit_system: input.preferredUnitSystem,
        p_protein_g: input.plan.proteinG,
        p_sex_for_calculation: input.sexForCalculation,
        p_target_weight_kg: input.targetWeightKg ?? -1,
        p_weekly_rate_kg: input.weeklyRateKg ?? 0,
      });

      if (error) {
        throw new OnboardingSaveError(
          'Your nutrition setup could not be saved. Please check your connection and try again.',
          error.code,
        );
      }
    },
  };
}

export const onboardingService = createOnboardingService(supabase);
