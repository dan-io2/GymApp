import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

import { createGoalEditingService } from '../goalEditingService';

describe('goalEditingService', () => {
  it('loads existing targets into editable data', async () => {
    const client = createClientMock();

    await expect(createGoalEditingService(client).getGoalEditingData('user-id')).resolves.toEqual({
      profile: {
        id: 'user-id',
        dateOfBirth: '1996-08-01',
        sexForCalculation: 'male',
        heightCm: 183,
        currentWeightKg: 82,
        preferredUnitSystem: 'imperial',
      },
      activeGoal: {
        id: 'goal-id',
        goalType: 'maintain',
        targetWeightKg: null,
        activityLevel: 'moderately_active',
        weeklyRateKg: null,
        dailyCalories: 2500,
        proteinG: 200,
        carbsG: 250,
        fatG: 78,
        targetSource: 'recommended',
        createdAt: '2026-08-10T00:00:00Z',
      },
    });
  });

  it('saves new active targets through the atomic custom-goal RPC', async () => {
    const client = createClientMock();

    await expect(
      createGoalEditingService(client).replaceActiveGoalTargets(
        {
          dailyCalories: 2400,
          proteinG: 210,
          carbsG: 230,
          fatG: 72,
        },
        'custom',
      ),
    ).resolves.toMatchObject({
      dailyCalories: 2400,
      proteinG: 210,
      carbsG: 230,
      fatG: 72,
      targetSource: 'custom',
    });

    expect(client.rpc).toHaveBeenCalledWith('replace_active_nutrition_goal', {
      p_carbs_g: 230,
      p_daily_calories: 2400,
      p_fat_g: 72,
      p_protein_g: 210,
      p_target_source: 'custom',
    });
  });

  it('preserves recommended target source when saving after reset', async () => {
    const client = createClientMock({
      rpcResult: {
        data: [
          {
            id: 'new-goal-id',
            goal_type: 'maintain',
            target_weight_kg: null,
            activity_level: 'moderately_active',
            weekly_rate_kg: null,
            daily_calories: 2819,
            protein_g: 148,
            carbs_g: 408,
            fat_g: 66,
            target_source: 'recommended',
            created_at: '2026-08-10T01:00:00Z',
          },
        ],
        error: null,
      },
    });

    await createGoalEditingService(client).replaceActiveGoalTargets(
      {
        dailyCalories: 2819,
        proteinG: 148,
        carbsG: 408,
        fatG: 66,
      },
      'recommended',
    );

    expect(client.rpc).toHaveBeenCalledWith('replace_active_nutrition_goal', {
      p_carbs_g: 408,
      p_daily_calories: 2819,
      p_fat_g: 66,
      p_protein_g: 148,
      p_target_source: 'recommended',
    });
  });
});

function createClientMock({
  rpcResult = {
    data: [
      {
        id: 'new-goal-id',
        goal_type: 'maintain',
        target_weight_kg: null,
        activity_level: 'moderately_active',
        weekly_rate_kg: null,
        daily_calories: 2400,
        protein_g: 210,
        carbs_g: 230,
        fat_g: 72,
        target_source: 'custom',
        created_at: '2026-08-10T01:00:00Z',
      },
    ],
    error: null,
  },
}: {
  rpcResult?: QueryResult;
} = {}): SupabaseClient<Database> {
  const profileQuery = createProfileQueryMock({
    data: {
      id: 'user-id',
      date_of_birth: '1996-08-01',
      sex_for_calculation: 'male',
      height_cm: 183,
      current_weight_kg: 82,
      preferred_unit_system: 'imperial',
    },
    error: null,
  });
  const goalQuery = createGoalQueryMock({
    data: {
      id: 'goal-id',
      goal_type: 'maintain',
      target_weight_kg: null,
      activity_level: 'moderately_active',
      weekly_rate_kg: null,
      daily_calories: 2500,
      protein_g: 200,
      carbs_g: 250,
      fat_g: 78,
      target_source: 'recommended',
      created_at: '2026-08-10T00:00:00Z',
    },
    error: null,
  });
  const rpc = jest.fn().mockResolvedValue(rpcResult);
  const from = jest.fn((table: string) => (table === 'profiles' ? profileQuery : goalQuery));

  return { from, rpc } as unknown as SupabaseClient<Database>;
}

type QueryResult = {
  data: unknown;
  error: { code: string } | null;
};

type ProfileQueryMock = {
  select: jest.Mock<ProfileQueryMock>;
  eq: jest.Mock<ProfileQueryMock>;
  maybeSingle: jest.Mock<Promise<QueryResult>>;
};

type GoalQueryMock = ProfileQueryMock & {
  order: jest.Mock<GoalQueryMock>;
  limit: jest.Mock<GoalQueryMock>;
};

function createProfileQueryMock(result: QueryResult): ProfileQueryMock {
  const query: ProfileQueryMock = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };

  return query;
}

function createGoalQueryMock(result: QueryResult): GoalQueryMock {
  const query: GoalQueryMock = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    order: jest.fn(() => query),
    limit: jest.fn(() => query),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };

  return query;
}
