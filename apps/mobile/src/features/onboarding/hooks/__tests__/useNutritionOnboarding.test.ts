import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useNutritionOnboarding } from '../useNutritionOnboarding';
import type { OnboardingService } from '../../services/onboardingService';

describe('useNutritionOnboarding', () => {
  it('calls completion after a successful onboarding save', async () => {
    const completeOnboarding = jest.fn().mockResolvedValue(undefined);
    const onCompleted = jest.fn().mockResolvedValue(undefined);
    const service: OnboardingService = { completeOnboarding };
    const { result } = renderHook(() =>
      useNutritionOnboarding({
        userId: 'user-id',
        profile: {
          id: 'user-id',
          onboardingCompleted: false,
          preferredUnitSystem: 'imperial',
        },
        service,
        onCompleted,
      }),
    );

    await fillValidOnboarding(result);
    await act(async () => {
      await result.current.save();
    });

    expect(completeOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        currentWeightKg: 81.65,
        heightCm: 182.88,
        preferredUnitSystem: 'imperial',
        userId: 'user-id',
      }),
    );
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('keeps the user on onboarding when saving fails', async () => {
    const completeOnboarding = jest.fn().mockRejectedValue(new Error('Save failed.'));
    const onCompleted = jest.fn();
    const service: OnboardingService = { completeOnboarding };
    const { result } = renderHook(() =>
      useNutritionOnboarding({
        userId: 'user-id',
        profile: null,
        service,
        onCompleted,
      }),
    );

    await fillValidOnboarding(result);
    await act(async () => {
      await result.current.save();
    });

    expect(result.current.state.currentStep).toBe('review');
    expect(result.current.state.saveErrorMessage).toBe('Save failed.');
    expect(onCompleted).not.toHaveBeenCalled();
  });
});

async function fillValidOnboarding(
  result: ReturnType<
    typeof renderHook<ReturnType<typeof useNutritionOnboarding>, unknown>
  >['result'],
) {
  await act(async () => {
    result.current.setField('dateOfBirth', '2001-06-15');
    result.current.setSelection('sexForCalculation', 'male');
    result.current.setField('heightFeet', '6');
    result.current.setField('heightInches', '0');
    result.current.setField('weightLb', '180');
    result.current.setSelection('activityLevel', 'moderately_active');
    result.current.setSelection('goalType', 'maintain');
  });

  while (result.current.state.currentStep !== 'review') {
    await act(async () => {
      result.current.goNext();
    });
  }

  await waitFor(() => {
    expect(result.current.state.review).not.toBeNull();
  });
}
