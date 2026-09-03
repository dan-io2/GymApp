import { calculateRecommendedTargets } from '../recommendedTargets';

describe('calculateRecommendedTargets', () => {
  it('uses TASK-005 nutrition calculations to reset recommendations', () => {
    const recommended = calculateRecommendedTargets({
      today: new Date('2026-08-10T12:00:00'),
      profile: {
        id: 'user-id',
        dateOfBirth: '1996-08-01',
        sexForCalculation: 'male',
        heightCm: 183,
        currentWeightKg: 82,
        preferredUnitSystem: 'imperial',
      },
      goal: {
        id: 'goal-id',
        goalType: 'maintain',
        targetWeightKg: null,
        activityLevel: 'moderately_active',
        weeklyRateKg: null,
        dailyCalories: 2300,
        proteinG: 190,
        carbsG: 225,
        fatG: 72,
        targetSource: 'custom',
        createdAt: '2026-08-10T00:00:00Z',
      },
    });

    expect(recommended).toEqual({
      dailyCalories: 2819,
      proteinG: 148,
      carbsG: 408,
      fatG: 66,
    });
  });
});
