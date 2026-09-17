import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

import type {
  DiaryDaySummary,
  ProgressSnapshot,
  UnitSystem,
  WeightCheckIn,
} from '../types/progressTypes';
import { toLocalDate } from '../utils/localDate';
import {
  aggregateDiaryDays,
  buildCalendarMonth,
  buildCalendarYear,
  buildConsistencySummary,
  buildMonthlyRecap,
  getWeightSummary,
} from '../utils/progressCalculations';

const PAGE_SIZE = 1000;

type BodyMetricRow = Database['public']['Tables']['body_metrics']['Row'];

export class ProgressError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ProgressError';
  }
}

export type ProgressService = {
  fetchSnapshot: (userId: string, now?: Date) => Promise<ProgressSnapshot>;
  saveWeightCheckIn: (input: {
    weightKg: number;
    localDate: string;
    recordedAt?: Date;
  }) => Promise<WeightCheckIn>;
  fetchWeightHistory: (userId: string) => Promise<WeightCheckIn[]>;
  fetchDiaryDaySummaries: (userId: string) => Promise<DiaryDaySummary[]>;
  updateUnitSystem: (userId: string, unitSystem: UnitSystem) => Promise<void>;
};

export function createProgressService(client: SupabaseClient<Database>): ProgressService {
  async function fetchWeightHistory(userId: string): Promise<WeightCheckIn[]> {
    const { data, error } = await client
      .from('body_metrics')
      .select(
        'id, user_id, weight_kg, local_date, recorded_at, created_at, updated_at, body_fat_percentage',
      )
      .eq('user_id', userId)
      .order('local_date', { ascending: true });

    if (error) {
      throw new ProgressError('Unable to load weight history.', error.code);
    }

    return (data ?? []).map(mapWeightCheckIn);
  }

  async function fetchDiaryDaySummaries(userId: string): Promise<DiaryDaySummary[]> {
    const rows: {
      localDate: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
    }[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await client
        .from('food_logs')
        .select('logged_at, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new ProgressError('Unable to load tracking history.', error.code);
      }

      for (const row of data ?? []) {
        rows.push({
          localDate: toLocalDate(new Date(row.logged_at)),
          calories: row.calories,
          proteinG: row.protein_g,
          carbsG: row.carbs_g,
          fatG: row.fat_g,
        });
      }

      if (!data || data.length < PAGE_SIZE) {
        break;
      }
    }

    return aggregateDiaryDays(rows);
  }

  return {
    fetchWeightHistory,
    fetchDiaryDaySummaries,

    async updateUnitSystem(userId, unitSystem) {
      const { error } = await client
        .from('profiles')
        .update({ preferred_unit_system: unitSystem })
        .eq('id', userId);

      if (error) {
        throw new ProgressError('Unable to update weight units.', error.code);
      }
    },

    async saveWeightCheckIn({ localDate, recordedAt = new Date(), weightKg }) {
      const { data, error } = await client.rpc('upsert_weight_check_in', {
        p_local_date: localDate,
        p_recorded_at: recordedAt.toISOString(),
        p_weight_kg: weightKg,
      });

      if (error || !data) {
        throw new ProgressError('Unable to save your weight check-in.', error?.code);
      }

      return mapWeightCheckIn(data);
    },

    async fetchSnapshot(userId, now = new Date()) {
      const [profileResult, checkIns, diaryDays] = await Promise.all([
        client.from('profiles').select('preferred_unit_system').eq('id', userId).single(),
        fetchWeightHistory(userId),
        fetchDiaryDaySummaries(userId),
      ]);

      if (profileResult.error) {
        throw new ProgressError('Unable to load progress preferences.', profileResult.error.code);
      }

      const today = toLocalDate(now);
      const weight = getWeightSummary(checkIns, today);
      const unitSystem: UnitSystem =
        profileResult.data.preferred_unit_system === 'imperial' ? 'imperial' : 'metric';

      return {
        unitSystem,
        checkIns: weight.history,
        calendarMonth: buildCalendarMonth(today.slice(0, 7), diaryDays, today),
        calendarYear: buildCalendarYear(Number(today.slice(0, 4)), diaryDays, today),
        latestCheckIn: weight.latestCheckIn,
        previousCheckIn: weight.previousCheckIn,
        changeKg: weight.changeKg,
        checkedInThisWeek: weight.checkedInThisWeek,
        daysSinceLastCheckIn: weight.daysSinceLastCheckIn,
        consistency: buildConsistencySummary(diaryDays, today),
        recap: buildMonthlyRecap(today.slice(0, 7), diaryDays, checkIns, today),
      };
    },
  };
}

export const progressService = createProgressService(supabase);

function mapWeightCheckIn(row: BodyMetricRow): WeightCheckIn {
  return {
    id: row.id,
    userId: row.user_id,
    weightKg: row.weight_kg,
    localDate: row.local_date,
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
