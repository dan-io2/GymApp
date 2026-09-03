import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

import { createDashboardService, DashboardDataError } from '../dashboardService';

describe('dashboardService', () => {
  it('maps the active nutrition goal and profile for the dashboard', async () => {
    const client = createClientMock({
      profileResult: {
        data: {
          id: 'user-id',
          preferred_unit_system: 'imperial',
          current_weight_kg: 82.1,
        },
        error: null,
      },
      goalResult: {
        data: {
          goal_type: 'maintain',
          target_weight_kg: null,
          activity_level: 'moderately_active',
          weekly_rate_kg: null,
          daily_calories: 2798,
          protein_g: 144,
          carbs_g: 412,
          fat_g: 64,
          target_source: 'recommended',
          created_at: '2026-08-10T10:00:00Z',
        },
        error: null,
      },
      logsResult: {
        data: [
          createFoodLogRow({
            calories: 160,
            protein_g: 3,
            carbs_g: 36,
            fat_g: 0,
          }),
        ],
        error: null,
      },
    });

    await expect(createDashboardService(client).getDashboardData('user-id')).resolves.toEqual({
      profile: {
        id: 'user-id',
        preferredUnitSystem: 'imperial',
        currentWeightKg: 82.1,
      },
      activeGoal: {
        goalType: 'maintain',
        targetWeightKg: null,
        activityLevel: 'moderately_active',
        weeklyRateKg: null,
        dailyCalories: 2798,
        proteinG: 144,
        carbsG: 412,
        fatG: 64,
        targetSource: 'recommended',
        createdAt: '2026-08-10T10:00:00Z',
      },
      dailyTotals: {
        caloriesConsumed: 160,
        proteinConsumedG: 3,
        carbsConsumedG: 36,
        fatConsumedG: 0,
      },
      dailyProgress: {
        calories: {
          consumed: 160,
          target: 2798,
          remaining: 2638,
          overage: 0,
          percentage: 5.72,
          progressRatio: expect.any(Number),
        },
        protein: {
          consumed: 3,
          target: 144,
          remaining: 141,
          overage: 0,
          percentage: 2.08,
          progressRatio: expect.any(Number),
        },
        carbs: {
          consumed: 36,
          target: 412,
          remaining: 376,
          overage: 0,
          percentage: 8.74,
          progressRatio: expect.any(Number),
        },
        fat: {
          consumed: 0,
          target: 64,
          remaining: 64,
          overage: 0,
          percentage: 0,
          progressRatio: 0,
        },
      },
    });
  });

  it('returns a null active goal when the user has no active nutrition target', async () => {
    const client = createClientMock({
      profileResult: {
        data: {
          id: 'user-id',
          preferred_unit_system: 'metric',
          current_weight_kg: 75,
        },
        error: null,
      },
      goalResult: {
        data: null,
        error: null,
      },
      logsResult: {
        data: [],
        error: null,
      },
    });

    const result = await createDashboardService(client).getDashboardData('user-id');

    expect(result.activeGoal).toBeNull();
    expect(result.dailyProgress).toBeNull();
  });

  it('throws a useful dashboard error when Supabase fails', async () => {
    const client = createClientMock({
      profileResult: {
        data: null,
        error: { code: 'PGRST500' },
      },
      goalResult: {
        data: null,
        error: null,
      },
      logsResult: {
        data: [],
        error: null,
      },
    });

    await expect(createDashboardService(client).getDashboardData('user-id')).rejects.toEqual(
      new DashboardDataError(
        'Unable to load your profile for the dashboard. Please try again.',
        'PGRST500',
      ),
    );
  });
});

type QueryResult = {
  data: unknown;
  error: { code: string } | null;
};

type ClientMockOptions = {
  profileResult: QueryResult;
  goalResult: QueryResult;
  logsResult: QueryResult;
};

function createClientMock(options: ClientMockOptions): SupabaseClient<Database> {
  const profileQuery = createProfileQueryMock(options.profileResult);
  const goalQuery = createGoalQueryMock(options.goalResult);
  const logsQuery = createLogsQueryMock(options.logsResult);
  const from = jest.fn((table: string) => {
    if (table === 'profiles') {
      return profileQuery;
    }

    if (table === 'food_logs') {
      return logsQuery;
    }

    return goalQuery;
  });

  return { from } as unknown as SupabaseClient<Database>;
}

type ProfileQueryMock = {
  select: jest.Mock<ProfileQueryMock>;
  eq: jest.Mock<ProfileQueryMock>;
  maybeSingle: jest.Mock<Promise<QueryResult>>;
};

type GoalQueryMock = ProfileQueryMock & {
  order: jest.Mock<GoalQueryMock>;
  limit: jest.Mock<GoalQueryMock>;
};

type LogsQueryMock = {
  select: jest.Mock<LogsQueryMock>;
  eq: jest.Mock<LogsQueryMock>;
  gte: jest.Mock<LogsQueryMock>;
  lt: jest.Mock<LogsQueryMock>;
  order: jest.Mock<Promise<QueryResult>>;
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

function createLogsQueryMock(result: QueryResult): LogsQueryMock {
  const query: LogsQueryMock = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    gte: jest.fn(() => query),
    lt: jest.fn(() => query),
    order: jest.fn().mockResolvedValue(result),
  };

  return query;
}

function createFoodLogRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'log-id',
    user_id: 'user-id',
    food_id: null,
    meal_type: 'lunch',
    food_name: 'Jasmine Rice',
    brand: 'Mahatma',
    quantity: 1,
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
