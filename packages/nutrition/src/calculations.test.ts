import {
  ACTIVITY_MULTIPLIERS,
  NutritionCalculationError,
  calculateBMR,
  calculateCalorieTarget,
  calculateMacroTargets,
  calculateNutritionPlan,
  calculateTDEE,
  cmToInches,
  inchesToCm,
  kgToLb,
  lbToKg,
} from './index';
import type { ActivityLevel, NutritionPlan } from './index';

describe('calculateBMR', () => {
  it('calculates male BMR with the Mifflin-St Jeor equation', () => {
    expect(
      calculateBMR({
        sexForCalculation: 'male',
        ageYears: 25,
        heightCm: 180,
        weightKg: 80,
      }),
    ).toBe(1805);
  });

  it('calculates female BMR with the Mifflin-St Jeor equation', () => {
    expect(
      calculateBMR({
        sexForCalculation: 'female',
        ageYears: 30,
        heightCm: 165,
        weightKg: 65,
      }),
    ).toBe(1370);
  });

  it('rejects invalid age, height, and weight', () => {
    expect(() =>
      calculateBMR({ sexForCalculation: 'male', ageYears: 0, heightCm: 180, weightKg: 80 }),
    ).toThrowCalculationError('INVALID_AGE');
    expect(() =>
      calculateBMR({ sexForCalculation: 'male', ageYears: 25, heightCm: 0, weightKg: 80 }),
    ).toThrowCalculationError('INVALID_HEIGHT');
    expect(() =>
      calculateBMR({ sexForCalculation: 'male', ageYears: 25, heightCm: 180, weightKg: -1 }),
    ).toThrowCalculationError('INVALID_WEIGHT');
  });

  it('rejects unsupported sex values', () => {
    expect(() =>
      calculateBMR({
        sexForCalculation: 'unknown' as never,
        ageYears: 25,
        heightCm: 180,
        weightKg: 80,
      }),
    ).toThrowCalculationError('INVALID_SEX');
  });
});

describe('calculateTDEE', () => {
  const expectedByActivity = {
    sedentary: 2166,
    lightly_active: 2482,
    moderately_active: 2798,
    very_active: 3114,
    extremely_active: 3430,
  } satisfies Record<ActivityLevel, number>;

  it('uses the centralized activity multipliers', () => {
    expect(ACTIVITY_MULTIPLIERS).toEqual({
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9,
    });
  });

  it.each(Object.entries(expectedByActivity) as [ActivityLevel, number][])(
    'calculates %s TDEE',
    (activityLevel, expected) => {
      expect(calculateTDEE(1805, activityLevel)).toBe(expected);
    },
  );

  it('rejects unsupported activity values', () => {
    expect(() => calculateTDEE(1805, 'weekend_warrior' as never)).toThrowCalculationError(
      'INVALID_ACTIVITY_LEVEL',
    );
  });
});

describe('calculateCalorieTarget', () => {
  it('keeps maintenance calories equal to TDEE', () => {
    expect(calculateCalorieTarget(2798, 'maintain')).toBe(2798);
  });

  it('uses conservative default loss and gain rates', () => {
    expect(calculateCalorieTarget(2798, 'lose')).toBe(2523);
    expect(calculateCalorieTarget(2798, 'gain')).toBe(3073);
  });

  it('uses explicit weekly rates when supplied', () => {
    expect(calculateCalorieTarget(2798, 'lose', 0.5)).toBe(2248);
    expect(calculateCalorieTarget(2798, 'gain', 0.5)).toBe(3348);
  });

  it('rejects unsupported goals and invalid weekly rates', () => {
    expect(() => calculateCalorieTarget(2798, 'recomp' as never)).toThrowCalculationError(
      'INVALID_GOAL_TYPE',
    );
    expect(() => calculateCalorieTarget(2798, 'lose', 0)).toThrowCalculationError(
      'INVALID_WEEKLY_RATE',
    );
  });
});

describe('calculateMacroTargets', () => {
  it('calculates protein, fat, and carbohydrates from body weight and remaining calories', () => {
    expect(calculateMacroTargets({ dailyCalories: 2798, weightKg: 80 })).toEqual({
      proteinG: 144,
      fatG: 64,
      carbsG: 412,
    });
  });

  it('supports configurable protein and fat strategies', () => {
    expect(
      calculateMacroTargets({
        dailyCalories: 2400,
        weightKg: 75,
        options: {
          proteinGramsPerKg: 2,
          fatGramsPerKg: 0.7,
        },
      }),
    ).toEqual({
      proteinG: 150,
      fatG: 53,
      carbsG: 331,
    });
  });

  it('rejects macro strategies that exceed the calorie target instead of returning negative carbs', () => {
    expect(() =>
      calculateMacroTargets({
        dailyCalories: 900,
        weightKg: 100,
        options: {
          proteinGramsPerKg: 2.5,
          fatGramsPerKg: 1.2,
        },
      }),
    ).toThrowCalculationError('MACRO_CALORIES_EXCEED_TARGET');
  });
});

describe('calculateNutritionPlan', () => {
  it('calculates a realistic male maintenance plan', () => {
    expect(
      calculateNutritionPlan({
        sexForCalculation: 'male',
        ageYears: 25,
        heightCm: 180,
        weightKg: 80,
        activityLevel: 'moderately_active',
        goalType: 'maintain',
      }),
    ).toEqual<NutritionPlan>({
      bmr: 1805,
      tdee: 2798,
      dailyCalories: 2798,
      proteinG: 144,
      carbsG: 412,
      fatG: 64,
    });
  });

  it('calculates a realistic female loss plan', () => {
    expect(
      calculateNutritionPlan({
        sexForCalculation: 'female',
        ageYears: 30,
        heightCm: 165,
        weightKg: 65,
        activityLevel: 'lightly_active',
        goalType: 'lose',
      }),
    ).toEqual<NutritionPlan>({
      bmr: 1370,
      tdee: 1884,
      dailyCalories: 1609,
      proteinG: 117,
      carbsG: 168,
      fatG: 52,
    });
  });

  it('calculates a realistic male gain plan', () => {
    expect(
      calculateNutritionPlan({
        sexForCalculation: 'male',
        ageYears: 22,
        heightCm: 183,
        weightKg: 82,
        activityLevel: 'very_active',
        goalType: 'gain',
      }),
    ).toEqual<NutritionPlan>({
      bmr: 1859,
      tdee: 3207,
      dailyCalories: 3482,
      proteinG: 148,
      carbsG: 574,
      fatG: 66,
    });
  });
});

describe('unit conversions', () => {
  it('converts between supported metric and imperial units', () => {
    expect(lbToKg(180)).toBeCloseTo(81.6466266);
    expect(kgToLb(81.6466266)).toBeCloseTo(180);
    expect(inchesToCm(70)).toBeCloseTo(177.8);
    expect(cmToInches(177.8)).toBeCloseTo(70);
  });
});

expect.extend({
  toThrowCalculationError(received: () => unknown, expectedCode: string) {
    try {
      received();

      return {
        message: () => `Expected function to throw ${expectedCode}.`,
        pass: false,
      };
    } catch (error) {
      const pass = error instanceof NutritionCalculationError && error.code === expectedCode;

      return {
        message: () =>
          `Expected ${error instanceof Error ? error.message : String(error)} to be ${expectedCode}.`,
        pass,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toThrowCalculationError(expectedCode: string): R;
    }
  }
}
