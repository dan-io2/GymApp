import type { OnboardingFormState } from '../../types/onboardingTypes';
import { createInitialOnboardingState } from '../unitConversion';
import { buildOnboardingReview, normalizeOnboardingInput } from '../onboardingValidation';

const TODAY = new Date('2026-08-10T12:00:00.000Z');

describe('onboarding validation', () => {
  it('returns missing required field errors', () => {
    const result = normalizeOnboardingInput(createInitialOnboardingState(), TODAY);

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        'Enter your date of birth.',
        'Choose the sex value used for the calorie calculation.',
        'Choose an activity level.',
        'Choose a goal.',
      ]),
    });
  });

  it('rejects invalid date of birth, height, and weight', () => {
    const result = normalizeOnboardingInput(
      createValidState({
        dateOfBirth: '2027-01-01',
        heightFeet: '0',
        heightInches: '0',
        weightLb: '-180',
      }),
      TODAY,
    );

    expect(result).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        'Enter a valid past birth date.',
        'Enter a height greater than 0 and no more than 300 cm.',
        'Enter a current weight greater than 0 and no more than 1000 kg.',
      ]),
    });
  });

  it('normalizes imperial values and calls the nutrition calculator with metric inputs', () => {
    const result = buildOnboardingReview(createValidState(), TODAY);

    expect(result).toMatchObject({
      ok: true,
      data: {
        ageYears: 25,
        input: {
          currentWeightKg: 81.65,
          heightCm: 182.88,
          preferredUnitSystem: 'imperial',
          weeklyRateKg: 0.23,
        },
        plan: {
          bmr: 1840,
          tdee: 2852,
          dailyCalories: 2599,
          proteinG: 147,
          fatG: 65,
        },
      },
    });
  });

  it('calculates a maintain plan without target weight or weekly rate', () => {
    const result = buildOnboardingReview(
      createValidState({
        goalType: 'maintain',
        targetWeightLb: '',
        weeklyRateLb: '',
      }),
      TODAY,
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        input: {
          goalType: 'maintain',
          targetWeightKg: null,
          weeklyRateKg: null,
        },
      },
    });
  });
});

function createValidState(overrides: Partial<OnboardingFormState> = {}): OnboardingFormState {
  return {
    ...createInitialOnboardingState('imperial'),
    dateOfBirth: '2001-06-15',
    sexForCalculation: 'male',
    heightFeet: '6',
    heightInches: '0',
    weightLb: '180',
    activityLevel: 'moderately_active',
    goalType: 'lose',
    targetWeightLb: '172',
    weeklyRateLb: '0.5',
    ...overrides,
  };
}
