import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import type { UseDashboardDataResult } from '../../hooks/useDashboardData';
import { DashboardScreen } from '../DashboardScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => callback(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(),
}));

const authContext = jest.requireMock('@/features/auth/context/AuthContext') as {
  useAuth: jest.Mock;
};
const dashboardHook = jest.requireMock('../../hooks/useDashboardData') as {
  useDashboardData: jest.Mock;
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    authContext.useAuth.mockReturnValue({
      user: {
        id: 'user-id',
        email: 'test@example.com',
      },
    });
  });

  it('displays calorie progress from today plus the active nutrition goal', () => {
    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult());

    render(<DashboardScreen />);

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('of 2,798 kcal')).toBeTruthy();
    expect(screen.getByText('2,798 kcal remaining')).toBeTruthy();
  });

  it('shows an obvious edit goals action that opens the edit route', () => {
    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult());

    render(<DashboardScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Edit Goals' }));

    expect(mockPush).toHaveBeenCalledWith('/goals/edit');
  });

  it('displays protein, carbs, and fat targets from the active nutrition goal', () => {
    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult());

    render(<DashboardScreen />);

    expect(screen.getByText('Protein')).toBeTruthy();
    expect(screen.getAllByText('0 g').length).toBeGreaterThan(0);
    expect(screen.getByText('of 144 g')).toBeTruthy();
    expect(screen.getByText('Carbs')).toBeTruthy();
    expect(screen.getByText('of 412 g')).toBeTruthy();
    expect(screen.getByText('Fat')).toBeTruthy();
    expect(screen.getByText('of 64 g')).toBeTruthy();
  });

  it('uses consumed over target progress instead of fixed macro calorie percentages', () => {
    dashboardHook.useDashboardData.mockReturnValue(
      createDashboardHookResult({
        data: {
          profile: {
            id: 'user-id',
            preferredUnitSystem: 'imperial',
            currentWeightKg: 98.4,
          },
          activeGoal: {
            goalType: 'lose',
            targetWeightKg: 81.65,
            activityLevel: 'moderately_active',
            weeklyRateKg: -0.91,
            dailyCalories: 2400,
            proteinG: 210,
            carbsG: 230,
            fatG: 72,
            targetSource: 'custom',
            createdAt: '2026-08-10T10:00:00Z',
          },
          dailyTotals: {
            caloriesConsumed: 640,
            proteinConsumedG: 52,
            carbsConsumedG: 75,
            fatConsumedG: 18,
          },
          dailyProgress: {
            calories: {
              consumed: 640,
              target: 2400,
              remaining: 1760,
              overage: 0,
              percentage: 26.67,
              progressRatio: 0.2667,
            },
            protein: {
              consumed: 52,
              target: 210,
              remaining: 158,
              overage: 0,
              percentage: 24.76,
              progressRatio: 0.2476,
            },
            carbs: {
              consumed: 75,
              target: 230,
              remaining: 155,
              overage: 0,
              percentage: 32.61,
              progressRatio: 0.3261,
            },
            fat: {
              consumed: 18,
              target: 72,
              remaining: 54,
              overage: 0,
              percentage: 25,
              progressRatio: 0.25,
            },
          },
        },
      }),
    );

    render(<DashboardScreen />);

    expect(screen.getByText('640')).toBeTruthy();
    expect(screen.getByText('of 2,400 kcal')).toBeTruthy();
    expect(screen.getByText('52 g')).toBeTruthy();
    expect(screen.getByText('of 210 g')).toBeTruthy();
    expect(screen.getByText('75 g')).toBeTruthy();
    expect(screen.getByText('of 230 g')).toBeTruthy();
    expect(screen.getByText('18 g')).toBeTruthy();
    expect(screen.getByText('of 72 g')).toBeTruthy();
    expect(screen.queryByText(/macro calories/i)).toBeNull();
  });

  it('renders over-target dashboard values without cramped slash text', () => {
    dashboardHook.useDashboardData.mockReturnValue(
      createDashboardHookResult({
        data: {
          profile: {
            id: 'user-id',
            preferredUnitSystem: 'imperial',
            currentWeightKg: 98.4,
          },
          activeGoal: {
            goalType: 'lose',
            targetWeightKg: 81.65,
            activityLevel: 'moderately_active',
            weeklyRateKg: -0.91,
            dailyCalories: 2133,
            proteinG: 177,
            carbsG: 179,
            fatG: 79,
            targetSource: 'custom',
            createdAt: '2026-08-10T10:00:00Z',
          },
          dailyTotals: {
            caloriesConsumed: 2494.45,
            proteinConsumedG: 297.2,
            carbsConsumedG: 450,
            fatConsumedG: 1000,
          },
          dailyProgress: {
            calories: {
              consumed: 2494.45,
              target: 2133,
              remaining: 0,
              overage: 361.45,
              percentage: 116.95,
              progressRatio: 1,
            },
            protein: {
              consumed: 297.2,
              target: 177,
              remaining: 0,
              overage: 120.2,
              percentage: 167.91,
              progressRatio: 1,
            },
            carbs: {
              consumed: 450,
              target: 179,
              remaining: 0,
              overage: 271,
              percentage: 251.4,
              progressRatio: 1,
            },
            fat: {
              consumed: 1000,
              target: 79,
              remaining: 0,
              overage: 921,
              percentage: 1265.82,
              progressRatio: 1,
            },
          },
        },
      }),
    );

    render(<DashboardScreen />);

    expect(screen.getByRole('header', { name: '2,494' })).toBeTruthy();
    expect(screen.getByText('of 2,133 kcal')).toBeTruthy();
    expect(screen.getByText('361 kcal over target')).toBeTruthy();
    expect(screen.getByText('297.2 g')).toBeTruthy();
    expect(screen.getByText('120.2 g over target')).toBeTruthy();
    expect(screen.getByText('450 g')).toBeTruthy();
    expect(screen.getByText('271 g over target')).toBeTruthy();
    expect(screen.getByText('1,000 g')).toBeTruthy();
    expect(screen.getByText('921 g over target')).toBeTruthy();
    expect(screen.queryByText(/2494\.45 \/ 2,133/)).toBeNull();
    expect(screen.queryByText(/297\.2 \/ 177/)).toBeNull();
    expect(screen.queryByText(/remaining/)).toBeNull();
  });

  it('shows a useful missing-goal recovery state', () => {
    dashboardHook.useDashboardData.mockReturnValue(
      createDashboardHookResult({
        data: {
          profile: {
            id: 'user-id',
            preferredUnitSystem: 'imperial',
            currentWeightKg: 82,
          },
          activeGoal: null,
          dailyTotals: {
            caloriesConsumed: 0,
            proteinConsumedG: 0,
            carbsConsumedG: 0,
            fatConsumedG: 0,
          },
          dailyProgress: null,
        },
      }),
    );

    render(<DashboardScreen />);

    expect(
      screen.getByRole('header', { name: "We couldn't find your nutrition targets." }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('shows a Supabase error with retry', () => {
    dashboardHook.useDashboardData.mockReturnValue(
      createDashboardHookResult({
        data: null,
        errorMessage: 'Unable to load your nutrition targets. Please try again.',
        status: 'error',
      }),
    );

    render(<DashboardScreen />);

    expect(
      screen.getByText('Unable to load your nutrition targets. Please try again.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('refreshes dashboard data from pull-to-refresh', () => {
    const refetch = jest.fn().mockResolvedValue(undefined);

    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult({ refetch }));

    render(<DashboardScreen />);

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    scrollView.props.refreshControl.props.onRefresh();

    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('opens the Find Food experience from quick actions', () => {
    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult());

    render(<DashboardScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Find Food' }));

    expect(mockPush).toHaveBeenCalledWith('/find-food');
  });

  it('opens the barcode scanner from quick actions', () => {
    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult());

    render(<DashboardScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Scan Barcode' }));

    expect(mockPush).toHaveBeenCalledWith('/scan');
  });

  it('shows empty-day consumed and remaining progress from real diary totals', () => {
    dashboardHook.useDashboardData.mockReturnValue(createDashboardHookResult());

    render(<DashboardScreen />);

    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('of 2,798 kcal')).toBeTruthy();
    expect(screen.getByText('2,798 kcal remaining')).toBeTruthy();
    expect(screen.getAllByText('0 g').length).toBeGreaterThan(0);
  });
});

function createDashboardHookResult(
  overrides: Partial<UseDashboardDataResult> = {},
): UseDashboardDataResult {
  return {
    data: {
      profile: {
        id: 'user-id',
        preferredUnitSystem: 'imperial',
        currentWeightKg: 82.2,
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
        caloriesConsumed: 0,
        proteinConsumedG: 0,
        carbsConsumedG: 0,
        fatConsumedG: 0,
      },
      dailyProgress: {
        calories: {
          consumed: 0,
          target: 2798,
          remaining: 2798,
          overage: 0,
          percentage: 0,
          progressRatio: 0,
        },
        protein: {
          consumed: 0,
          target: 144,
          remaining: 144,
          overage: 0,
          percentage: 0,
          progressRatio: 0,
        },
        carbs: {
          consumed: 0,
          target: 412,
          remaining: 412,
          overage: 0,
          percentage: 0,
          progressRatio: 0,
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
    },
    errorCode: null,
    errorMessage: null,
    isLoading: false,
    isRefreshing: false,
    refetch: jest.fn(),
    status: 'success',
    ...overrides,
  };
}
