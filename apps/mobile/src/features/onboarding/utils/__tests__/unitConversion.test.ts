import { createInitialOnboardingState, switchUnitSystem } from '../unitConversion';

describe('onboarding unit conversion', () => {
  it('converts imperial entries to metric without clearing values', () => {
    const state = {
      ...createInitialOnboardingState('imperial'),
      heightFeet: '6',
      heightInches: '0',
      weightLb: '180',
      targetWeightLb: '172',
      weeklyRateLb: '0.5',
    };

    expect(switchUnitSystem(state, 'metric')).toMatchObject({
      unitSystem: 'metric',
      heightCm: '182.9',
      weightKg: '81.6',
      targetWeightKg: '78',
      weeklyRateKg: '0.2',
      weightLb: '180',
    });
  });

  it('converts metric entries to imperial without clearing values', () => {
    const state = {
      ...createInitialOnboardingState('metric'),
      heightCm: '183',
      weightKg: '82',
      targetWeightKg: '86',
      weeklyRateKg: '0.25',
    };

    expect(switchUnitSystem(state, 'imperial')).toMatchObject({
      unitSystem: 'imperial',
      heightFeet: '6',
      heightInches: '0',
      weightLb: '180.8',
      targetWeightLb: '189.6',
      weeklyRateLb: '0.6',
      weightKg: '82',
    });
  });
});
