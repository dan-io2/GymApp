import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGoalEditing } from '../useGoalEditing';
import type { GoalEditingData } from '../../types/goalEditingTypes';
import type { GoalEditingService } from '../../services/goalEditingService';

describe('useGoalEditing', () => {
  it('edits protein independently without changing carbs or fat', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() =>
      useGoalEditing({
        service,
        userId: 'user-id',
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.updateField('proteinG', '210');
    });

    expect(result.current.form).toEqual({
      dailyCalories: '2300',
      proteinG: '210',
      carbsG: '220',
      fatG: '75',
    });

    await act(async () => {
      await result.current.save();
    });

    expect(service.replaceActiveGoalTargets).toHaveBeenCalledWith(
      {
        dailyCalories: 2300,
        proteinG: 210,
        carbsG: 220,
        fatG: 75,
      },
      'custom',
    );
  });

  it('edits carbs independently without changing protein', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() =>
      useGoalEditing({
        service,
        userId: 'user-id',
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.updateField('carbsG', '190');
    });

    expect(result.current.form.proteinG).toBe('180');
    expect(result.current.form.carbsG).toBe('190');
    expect(result.current.form.fatG).toBe('75');
  });

  it('edits fat independently without changing protein', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() =>
      useGoalEditing({
        service,
        userId: 'user-id',
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.updateField('fatG', '76');
    });

    expect(result.current.form.proteinG).toBe('180');
    expect(result.current.form.carbsG).toBe('220');
    expect(result.current.form.fatG).toBe('76');
  });

  it('saves recommended targets after explicit reset only', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() =>
      useGoalEditing({
        service,
        userId: 'user-id',
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.resetToRecommended();
    });

    expect(service.replaceActiveGoalTargets).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.save();
    });

    expect(service.replaceActiveGoalTargets).toHaveBeenCalledWith(
      expect.objectContaining({
        dailyCalories: expect.any(Number),
        proteinG: expect.any(Number),
        carbsG: expect.any(Number),
        fatG: expect.any(Number),
      }),
      'recommended',
    );
  });

  it('keeps edited form values and skips completion when save fails', async () => {
    const service = createServiceMock({
      replaceActiveGoalTargets: jest.fn().mockRejectedValue(new Error('Save failed.')),
    });
    const onSaved = jest.fn();
    const { result } = renderHook(() =>
      useGoalEditing({
        onSaved,
        service,
        userId: 'user-id',
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    act(() => {
      result.current.updateField('proteinG', '210');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.form.proteinG).toBe('210');
    expect(result.current.form.carbsG).toBe('220');
    expect(result.current.saveErrorMessage).toBe('Save failed.');
    expect(onSaved).not.toHaveBeenCalled();
  });
});

function createServiceMock(overrides: Partial<GoalEditingService> = {}): GoalEditingService {
  return {
    getGoalEditingData: jest.fn().mockResolvedValue(createGoalEditingData()),
    replaceActiveGoalTargets: jest.fn().mockResolvedValue({
      ...createGoalEditingData().activeGoal,
      id: 'new-goal-id',
      proteinG: 210,
      targetSource: 'custom',
    }),
    ...overrides,
  };
}

function createGoalEditingData(): GoalEditingData {
  return {
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
      dailyCalories: 2300,
      proteinG: 180,
      carbsG: 220,
      fatG: 75,
      targetSource: 'recommended',
      createdAt: '2026-08-10T00:00:00Z',
    },
  };
}
