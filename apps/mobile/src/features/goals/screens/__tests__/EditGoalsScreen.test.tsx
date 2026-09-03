import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { EditGoalsScreen } from '../EditGoalsScreen';
import type { UseGoalEditingResult } from '../../hooks/useGoalEditing';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: mockReplace,
  }),
}));

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-id',
    },
  }),
}));

jest.mock('../../hooks/useGoalEditing', () => ({
  useGoalEditing: jest.fn(),
}));

const goalEditingHook = jest.requireMock('../../hooks/useGoalEditing') as {
  useGoalEditing: jest.Mock;
};

describe('EditGoalsScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    goalEditingHook.useGoalEditing.mockReturnValue(createHookResult());
  });

  it('populates the form with existing targets', () => {
    render(<EditGoalsScreen />);

    expect(screen.getByDisplayValue('2500')).toBeTruthy();
    expect(screen.getByDisplayValue('200')).toBeTruthy();
    expect(screen.getByDisplayValue('250')).toBeTruthy();
    expect(screen.getByDisplayValue('78')).toBeTruthy();
  });

  it('edits calories, protein, carbs, and fat fields', () => {
    const updateField = jest.fn();

    goalEditingHook.useGoalEditing.mockReturnValue(createHookResult({ updateField }));

    render(<EditGoalsScreen />);

    fireEvent.changeText(screen.getByLabelText('Daily Calories'), '2300');
    fireEvent.changeText(screen.getByLabelText('Protein'), '190');
    fireEvent.changeText(screen.getByLabelText('Carbs'), '225');
    fireEvent.changeText(screen.getByLabelText('Fat'), '72');

    expect(updateField).toHaveBeenCalledWith('dailyCalories', '2300');
    expect(updateField).toHaveBeenCalledWith('proteinG', '190');
    expect(updateField).toHaveBeenCalledWith('carbsG', '225');
    expect(updateField).toHaveBeenCalledWith('fatG', '72');
  });

  it('offers reset to recommended without saving immediately', () => {
    const resetToRecommended = jest.fn();
    const save = jest.fn();

    goalEditingHook.useGoalEditing.mockReturnValue(
      createHookResult({
        resetToRecommended,
        save,
      }),
    );

    render(<EditGoalsScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Reset to Recommended' }));

    expect(resetToRecommended).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
  });

  it('does not pretend success when save fails', async () => {
    const save = jest.fn().mockResolvedValue(false);

    goalEditingHook.useGoalEditing.mockReturnValue(
      createHookResult({
        save,
        saveErrorMessage: 'Your nutrition targets could not be saved. Please try again.',
      }),
    );

    render(<EditGoalsScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Save Goals' }));

    await waitFor(() => {
      expect(save).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByText('Your nutrition targets could not be saved. Please try again.'),
    ).toBeTruthy();
  });
});

function createHookResult(overrides: Partial<UseGoalEditingResult> = {}): UseGoalEditingResult {
  return {
    data: {
      profile: {
        currentWeightKg: 82,
        dateOfBirth: '1995-01-01',
        heightCm: 180,
        id: 'user-id',
        preferredUnitSystem: 'imperial',
        sexForCalculation: 'male',
      },
      activeGoal: {
        activityLevel: 'moderately_active',
        carbsG: 250,
        createdAt: '2026-08-10T12:00:00.000Z',
        dailyCalories: 2500,
        fatG: 78,
        goalType: 'maintain',
        id: 'goal-id',
        proteinG: 200,
        targetSource: 'recommended',
        targetWeightKg: null,
        weeklyRateKg: null,
      },
    },
    errorMessage: null,
    errors: [],
    form: {
      dailyCalories: '2500',
      proteinG: '200',
      carbsG: '250',
      fatG: '78',
    },
    isLoading: false,
    isSaving: false,
    macroCalories: 2502,
    macroDifference: 2,
    refetch: jest.fn(),
    resetToRecommended: jest.fn(),
    save: jest.fn(),
    saveErrorMessage: null,
    status: 'success',
    updateField: jest.fn(),
    warnings: [],
    ...overrides,
  };
}
