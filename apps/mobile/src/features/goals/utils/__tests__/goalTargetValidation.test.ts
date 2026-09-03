import { calculateMacroCalories, validateGoalTargetForm } from '../goalTargetValidation';

describe('goalTargetValidation', () => {
  it('accepts valid custom target values', () => {
    expect(
      validateGoalTargetForm({
        dailyCalories: '2300',
        proteinG: '190',
        carbsG: '225',
        fatG: '72',
      }),
    ).toMatchObject({
      isValid: true,
      values: {
        dailyCalories: 2300,
        proteinG: 190,
        carbsG: 225,
        fatG: 72,
      },
    });
  });

  it('rejects negative and non-numeric values', () => {
    const result = validateGoalTargetForm({
      dailyCalories: '-1',
      proteinG: 'NaN',
      carbsG: 'Infinity',
      fatG: 'abc',
    });

    expect(result.isValid).toBe(false);
    if (result.isValid) {
      throw new Error('Expected invalid target values.');
    }
    expect(result.errors).toEqual([
      'Daily calories cannot be negative.',
      'Protein must be a valid number.',
      'Carbs must be a valid number.',
      'Fat must be a valid number.',
    ]);
  });

  it('calculates macro calories and difference without forcing them to match', () => {
    expect(
      calculateMacroCalories({
        dailyCalories: 2500,
        proteinG: 200,
        carbsG: 250,
        fatG: 78,
      }),
    ).toEqual({
      macroCalories: 2502,
      difference: 2,
    });
  });

  it('warns for a large macro calorie mismatch', () => {
    const result = validateGoalTargetForm({
      dailyCalories: '2500',
      proteinG: '250',
      carbsG: '300',
      fatG: '100',
    });

    expect(result.warnings).toContain(
      'Your macro targets add up to approximately 3,100 calories, which is significantly different from your 2,500 calorie target.',
    );
  });
});
