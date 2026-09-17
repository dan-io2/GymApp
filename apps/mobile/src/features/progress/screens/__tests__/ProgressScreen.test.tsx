import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProgressScreen } from '../ProgressScreen';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-id' } }),
}));

jest.mock('../../hooks/useProgress', () => ({
  useProgress: jest.fn(),
}));

const progressHook = jest.requireMock('../../hooks/useProgress') as {
  useProgress: jest.Mock;
};

describe('ProgressScreen', () => {
  it('renders a post-save weight loss in pounds without crashing', () => {
    progressHook.useProgress.mockReturnValue({
      data: {
        unitSystem: 'imperial',
        checkIns: [
          {
            id: 'check-in-id',
            userId: 'user-id',
            weightKg: 90,
            localDate: '2026-09-16',
            recordedAt: '2026-09-16T12:00:00.000Z',
            createdAt: '2026-09-16T12:00:00.000Z',
            updatedAt: '2026-09-16T12:00:00.000Z',
          },
        ],
        calendarMonth: [],
        calendarYear: [],
        latestCheckIn: null,
        previousCheckIn: null,
        changeKg: -1,
        checkedInThisWeek: true,
        daysSinceLastCheckIn: 0,
        consistency: {
          currentStreak: 1,
          longestStreak: 1,
          monthlyConsistencyPercentage: 100,
          monthlyEligibleDays: 1,
          monthlyTrackedDays: 1,
          totalTrackedDays: 1,
        },
        recap: {
          month: '2026-09',
          trackedDays: 1,
          eligibleDays: 1,
          consistencyPercentage: 100,
          longestStreak: 1,
          totalFoodsLogged: 1,
          averageCalories: 2000,
          averageProteinG: 180,
          averageCarbsG: 200,
          averageFatG: 70,
          calorieTargetDays: null,
          proteinTargetDays: null,
          startingWeightKg: 91,
          endingWeightKg: 90,
          weightChangeKg: -1,
        },
      },
      status: 'success',
      errorMessage: null,
      isSaving: false,
      refetch: jest.fn(),
      saveCheckIn: jest.fn(),
      changeUnitSystem: jest.fn(),
    });

    render(<ProgressScreen />);

    expect(screen.getByText('Change from previous: -2.2 lb')).toBeTruthy();
    const oneMonth = screen.getByRole('button', { name: '1m' });
    expect(oneMonth.props.accessibilityState).toEqual({ selected: false });

    fireEvent.press(oneMonth);

    expect(screen.getByRole('button', { name: '1m' }).props.accessibilityState).toEqual({
      selected: true,
    });
  });
});
