import type { ActivityLevel, GoalType } from '@gymapp/nutrition';
import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { createFoodDiaryService } from '@/features/diary/services/foodDiaryService';
import { calculateNutritionProgress } from '@/features/diary/utils/foodDiaryUtils';

import type {
  ActiveNutritionGoal,
  DashboardData,
  DashboardProfile,
  TargetSource,
} from '../types/dashboardTypes';

export class DashboardDataError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'DashboardDataError';
  }
}

export type DashboardService = {
  getDashboardData: (userId: string) => Promise<DashboardData>;
};

export function createDashboardService(client: SupabaseClient<Database>): DashboardService {
  return {
    async getDashboardData(userId) {
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('id, preferred_unit_system, current_weight_kg')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw new DashboardDataError(
          'Unable to load your profile for the dashboard. Please try again.',
          profileError.code,
        );
      }

      if (!profile) {
        throw new DashboardDataError(
          'Your profile could not be found. Please sign out and sign back in.',
          'PROFILE_NOT_FOUND',
        );
      }

      const { data: activeGoal, error: activeGoalError } = await client
        .from('nutrition_goals')
        .select(
          'goal_type, target_weight_kg, activity_level, weekly_rate_kg, daily_calories, protein_g, carbs_g, fat_g, target_source, created_at',
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeGoalError) {
        throw new DashboardDataError(
          'Unable to load your nutrition targets. Please try again.',
          activeGoalError.code,
        );
      }

      const mappedActiveGoal = activeGoal ? mapActiveGoal(activeGoal) : null;
      const diaryService = createFoodDiaryService(client);
      const todayLogs = await diaryService.fetchLogsForLocalDate(userId, new Date());
      const dailyTotals = diaryService.calculateTotals(todayLogs);

      return {
        profile: mapProfile(profile),
        activeGoal: mappedActiveGoal,
        dailyTotals,
        dailyProgress: mappedActiveGoal
          ? calculateNutritionProgress(
              {
                dailyCalories: mappedActiveGoal.dailyCalories,
                proteinG: mappedActiveGoal.proteinG,
                carbsG: mappedActiveGoal.carbsG,
                fatG: mappedActiveGoal.fatG,
              },
              dailyTotals,
            )
          : null,
      };
    },
  };
}

export const dashboardService = createDashboardService(supabase);

function mapProfile(profile: {
  id: string;
  preferred_unit_system: string;
  current_weight_kg: number | null;
}): DashboardProfile {
  return {
    id: profile.id,
    preferredUnitSystem: profile.preferred_unit_system === 'metric' ? 'metric' : 'imperial',
    currentWeightKg: profile.current_weight_kg,
  };
}

function mapActiveGoal(goal: {
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
}): ActiveNutritionGoal {
  return {
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

export function mapTargetSource(value: string | null | undefined): TargetSource {
  return value === 'custom' ? 'custom' : 'recommended';
}

export function mapGoalType(value: string): GoalType {
  if (value === 'lose' || value === 'maintain' || value === 'gain') {
    return value;
  }

  throw new DashboardDataError('The active nutrition goal has an unsupported goal type.');
}

export function mapActivityLevel(value: string): ActivityLevel {
  if (
    value === 'sedentary' ||
    value === 'lightly_active' ||
    value === 'moderately_active' ||
    value === 'very_active' ||
    value === 'extremely_active'
  ) {
    return value;
  }

  throw new DashboardDataError('The active nutrition goal has an unsupported activity level.');
}
