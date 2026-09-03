import type { SexForCalculation } from '@gymapp/nutrition';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  mapActivityLevel,
  mapGoalType,
  mapTargetSource,
} from '@/features/dashboard/services/dashboardService';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

import type {
  EditableGoalProfile,
  EditableNutritionGoal,
  GoalEditingData,
  GoalTargetSource,
  GoalTargetValues,
} from '../types/goalEditingTypes';

export class GoalEditingError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'GoalEditingError';
  }
}

export type GoalEditingService = {
  getGoalEditingData: (userId: string) => Promise<GoalEditingData>;
  replaceActiveGoalTargets: (
    values: GoalTargetValues,
    targetSource: GoalTargetSource,
  ) => Promise<EditableNutritionGoal>;
};

export function createGoalEditingService(client: SupabaseClient<Database>): GoalEditingService {
  return {
    async getGoalEditingData(userId) {
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select(
          'id, date_of_birth, sex_for_calculation, height_cm, current_weight_kg, preferred_unit_system',
        )
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw new GoalEditingError(
          'Unable to load your profile for goal editing. Please try again.',
          profileError.code,
        );
      }

      if (!profile) {
        throw new GoalEditingError(
          'Your profile could not be found. Please sign out and sign back in.',
          'PROFILE_NOT_FOUND',
        );
      }

      const { data: activeGoal, error: activeGoalError } = await client
        .from('nutrition_goals')
        .select(
          'id, goal_type, target_weight_kg, activity_level, weekly_rate_kg, daily_calories, protein_g, carbs_g, fat_g, target_source, created_at',
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeGoalError) {
        throw new GoalEditingError(
          'Unable to load your active nutrition goal. Please try again.',
          activeGoalError.code,
        );
      }

      if (!activeGoal) {
        throw new GoalEditingError(
          'No active nutrition goal was found. Please complete onboarding before editing targets.',
          'ACTIVE_GOAL_NOT_FOUND',
        );
      }

      return {
        profile: mapProfile(profile),
        activeGoal: mapEditableGoal(activeGoal),
      };
    },

    async replaceActiveGoalTargets(values, targetSource) {
      const { data, error } = await client.rpc('replace_active_nutrition_goal', {
        p_carbs_g: values.carbsG,
        p_daily_calories: values.dailyCalories,
        p_fat_g: values.fatG,
        p_protein_g: values.proteinG,
        p_target_source: targetSource,
      });

      if (error) {
        if (__DEV__) {
          console.info('[GymApp goal save rpc]', {
            code: error.code,
            message: error.message,
            rpc: 'replace_active_nutrition_goal',
          });
        }

        throw new GoalEditingError(
          "We couldn't save your nutrition goals. Your changes have not been lost.",
          error.code,
        );
      }

      const newGoal = data?.[0];

      if (!newGoal) {
        throw new GoalEditingError(
          "We couldn't confirm your saved nutrition goals. Your changes have not been lost.",
          'GOAL_SAVE_EMPTY_RESPONSE',
        );
      }

      return mapEditableGoal(newGoal);
    },
  };
}

export const goalEditingService = createGoalEditingService(supabase);

function mapProfile(profile: {
  id: string;
  date_of_birth: string | null;
  sex_for_calculation: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  preferred_unit_system: string;
}): EditableGoalProfile {
  return {
    id: profile.id,
    dateOfBirth: profile.date_of_birth,
    sexForCalculation: mapOptionalSex(profile.sex_for_calculation),
    heightCm: profile.height_cm,
    currentWeightKg: profile.current_weight_kg,
    preferredUnitSystem: profile.preferred_unit_system === 'metric' ? 'metric' : 'imperial',
  };
}

function mapEditableGoal(goal: {
  id: string;
  goal_type: string;
  target_weight_kg: number | null;
  activity_level: string;
  weekly_rate_kg: number | null;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  target_source: string;
  created_at: string;
}): EditableNutritionGoal {
  return {
    id: goal.id,
    goalType: mapGoalType(goal.goal_type),
    targetWeightKg: goal.target_weight_kg,
    activityLevel: mapActivityLevel(goal.activity_level),
    weeklyRateKg: goal.weekly_rate_kg,
    dailyCalories: goal.daily_calories,
    proteinG: goal.protein_g,
    carbsG: goal.carbs_g,
    fatG: goal.fat_g,
    targetSource: mapTargetSource(goal.target_source),
    createdAt: goal.created_at,
  };
}

function mapOptionalSex(value: string | null): SexForCalculation | null {
  if (value === 'male' || value === 'female') {
    return value;
  }

  return null;
}
