declare function require(moduleName: string): {
  normalizeOpenFoodFactsProduct?: (response: unknown) => unknown;
  normalizeUsdaSearchFood?: (food: unknown) => unknown;
};

const {
  normalizeOpenFoodFactsProduct,
} = require('../../../../../../../supabase/functions/_shared/open-food-facts-adapter.ts');
const {
  normalizeUsdaSearchFood,
} = require('../../../../../../../supabase/functions/_shared/usda-adapter.ts');

describe('provider nutrition basis normalization', () => {
  it('uses explicit Open Food Facts per-serving nutrition when present', () => {
    expect(
      normalizeOpenFoodFactsProduct?.(createQuestResponseWithServingNutrition()),
    ).toMatchObject({
      calories: 140,
      proteinG: 20,
      carbsG: 4,
      fatG: 4.5,
      fiberG: 1,
      sugarG: 1,
      sodiumMg: 320,
      servingBasis: 'per_serving',
      servingDescription: '32 g',
      servingSize: 32,
      servingUnit: 'g',
      servingsPerContainer: 8,
    });
  });

  it('converts Open Food Facts per-100g values to a known 32g serving', () => {
    expect(
      normalizeOpenFoodFactsProduct?.(createQuestResponseWithPer100gNutrition()),
    ).toMatchObject({
      calories: 140,
      proteinG: 20,
      carbsG: 4,
      fatG: 4.5,
      fiberG: 1,
      sugarG: 1,
      sodiumMg: 320,
      servingBasis: 'per_serving',
      servingSize: 32,
      servingUnit: 'g',
      servingsPerContainer: 8,
    });
  });

  it('does not turn a serving into a full package when servings per container exists', () => {
    const normalized = normalizeOpenFoodFactsProduct?.(
      createQuestResponseWithPer100gNutrition(),
    ) as {
      calories: number;
      servingSize: number;
      servingsPerContainer: number;
    };

    expect(normalized.servingSize).toBe(32);
    expect(normalized.servingsPerContainer).toBe(8);
    expect(normalized.calories).toBe(140);
  });

  it('falls back to explicit per-100g basis when serving size is missing', () => {
    expect(
      normalizeOpenFoodFactsProduct?.({
        code: 'missing-serving',
        product: {
          code: 'missing-serving',
          product_name: 'Per 100g Product',
          nutriments: {
            'energy-kcal_100g': 250,
            proteins_100g: 10,
            carbohydrates_100g: 20,
            fat_100g: 8,
          },
        },
      }),
    ).toMatchObject({
      calories: 250,
      proteinG: 10,
      carbsG: 20,
      fatG: 8,
      servingBasis: 'per_100g',
      servingSize: null,
      servingUnit: null,
    });
  });

  it('preserves serving descriptions that include count and grams', () => {
    expect(
      normalizeOpenFoodFactsProduct?.({
        code: 'bar',
        product: {
          code: 'bar',
          product_name: 'Protein Bar',
          serving_size: '1 bar (45 g)',
          nutriments: {
            'energy-kcal_100g': 400,
            proteins_100g: 30,
            carbohydrates_100g: 40,
            fat_100g: 10,
          },
        },
      }),
    ).toMatchObject({
      calories: 180,
      servingDescription: '1 bar (45 g)',
      servingSize: 45,
      servingUnit: 'g',
    });
  });

  it('keeps Mahatma rice serving normalization stable', () => {
    expect(
      normalizeOpenFoodFactsProduct?.({
        code: '0017400106959',
        product: {
          brands: 'Mahatma',
          code: '0017400106959',
          product_name: 'Jasmine Thai Fragrant Rice',
          serving_quantity: 45,
          serving_quantity_unit: 'g',
          serving_size: '45 g',
          nutriments: {
            'energy-kcal_serving': 160,
            proteins_serving: 3,
            carbohydrates_serving: 36,
            fat_serving: 0,
          },
        },
      }),
    ).toMatchObject({
      calories: 160,
      proteinG: 3,
      carbsG: 36,
      fatG: 0,
      servingBasis: 'per_serving',
      servingSize: 45,
    });
  });

  it('warns in development for obvious macro-mass serving mismatches', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    normalizeOpenFoodFactsProduct?.({
      code: 'bad-basis',
      product: {
        code: 'bad-basis',
        product_name: 'Bad Basis Product',
        serving_quantity: 32,
        serving_quantity_unit: 'g',
        nutriments: {
          'energy-kcal_serving': 406,
          proteins_serving: 71.9,
          carbohydrates_serving: 12.5,
          fat_serving: 7.8,
        },
      },
    });

    expect(console.warn).toHaveBeenCalledWith(
      '[GymApp provider sanity]',
      expect.objectContaining({
        barcode: 'bad-basis',
        servingSize: 32,
      }),
    );
  });

  it('normalizes USDA nutrients with explicit per-serving or per-100g basis', () => {
    expect(
      normalizeUsdaSearchFood?.({
        fdcId: 2646170,
        description: 'USDA Test Food',
        servingSize: 50,
        servingSizeUnit: 'g',
        foodNutrients: [
          { nutrientId: 1008, value: 200 },
          { nutrientId: 1003, value: 20 },
          { nutrientId: 1005, value: 30 },
          { nutrientId: 1004, value: 5 },
        ],
      }),
    ).toMatchObject({
      calories: 100,
      proteinG: 10,
      carbsG: 15,
      fatG: 2.5,
      servingBasis: 'per_serving',
      servingSize: 50,
    });

    expect(
      normalizeUsdaSearchFood?.({
        fdcId: 2646171,
        description: 'USDA No Serving Food',
        foodNutrients: [
          { nutrientId: 1008, value: 200 },
          { nutrientId: 1003, value: 20 },
          { nutrientId: 1005, value: 30 },
          { nutrientId: 1004, value: 5 },
        ],
      }),
    ).toMatchObject({
      calories: 200,
      servingBasis: 'per_100g',
      servingSize: 100,
      servingUnit: 'g',
    });
  });

  it('converts USDA mass servings expressed in ounces using the exact mass factor', () => {
    expect(
      normalizeUsdaSearchFood?.({
        fdcId: 2646172,
        description: 'USDA Ounce Food',
        servingSize: 2,
        servingSizeUnit: 'oz',
        foodNutrients: [
          { nutrientId: 1008, value: 200 },
          { nutrientId: 1003, value: 20 },
          { nutrientId: 1005, value: 30 },
          { nutrientId: 1004, value: 5 },
        ],
      }),
    ).toMatchObject({
      servingBasis: 'per_serving',
      servingSize: 2,
      servingUnit: 'oz',
    });

    const normalized = normalizeUsdaSearchFood?.({
      fdcId: 2646172,
      description: 'USDA Ounce Food',
      servingSize: 2,
      servingSizeUnit: 'oz',
      foodNutrients: [
        { nutrientId: 1008, value: 200 },
        { nutrientId: 1003, value: 20 },
        { nutrientId: 1005, value: 30 },
        { nutrientId: 1004, value: 5 },
      ],
    }) as { calories: number; proteinG: number; carbsG: number; fatG: number };

    expect(normalized.calories).toBeCloseTo(113.398, 3);
    expect(normalized.proteinG).toBeCloseTo(11.3398, 3);
    expect(normalized.carbsG).toBeCloseTo(17.0097, 3);
    expect(normalized.fatG).toBeCloseTo(2.83495, 3);
  });

  it('converts Open Food Facts per-100g values for an ounce serving exactly once', () => {
    expect(
      normalizeOpenFoodFactsProduct?.({
        code: 'ounce-product',
        product: {
          code: 'ounce-product',
          product_name: 'Ounce Product',
          serving_quantity: 1,
          serving_quantity_unit: 'oz',
          nutriments: {
            'energy-kcal_100g': 200,
            proteins_100g: 20,
            carbohydrates_100g: 30,
            fat_100g: 5,
          },
        },
      }),
    ).toMatchObject({
      servingBasis: 'per_serving',
      servingSize: 1,
      servingUnit: 'oz',
    });

    const normalized = normalizeOpenFoodFactsProduct?.({
      code: 'ounce-product',
      product: {
        code: 'ounce-product',
        product_name: 'Ounce Product',
        serving_quantity: 1,
        serving_quantity_unit: 'oz',
        nutriments: {
          'energy-kcal_100g': 200,
          proteins_100g: 20,
          carbohydrates_100g: 30,
          fat_100g: 5,
        },
      },
    }) as { calories: number; proteinG: number; carbsG: number; fatG: number };

    expect(normalized.calories).toBeCloseTo(56.699, 3);
    expect(normalized.proteinG).toBeCloseTo(5.6699, 3);
    expect(normalized.carbsG).toBeCloseTo(8.5048, 3);
    expect(normalized.fatG).toBeCloseTo(1.4175, 3);
  });
});

function createQuestResponseWithServingNutrition() {
  return {
    code: 'quest',
    product: {
      brands: 'Quest Nutrition',
      code: 'quest',
      number_of_servings: 8,
      product_name: 'Protein Chips',
      serving_quantity: 32,
      serving_quantity_unit: 'g',
      serving_size: '32 g',
      nutriments: {
        'energy-kcal_serving': 140,
        proteins_serving: 20,
        carbohydrates_serving: 4,
        fat_serving: 4.5,
        fiber_serving: 1,
        sugars_serving: 1,
        sodium_serving: 0.32,
      },
    },
  };
}

function createQuestResponseWithPer100gNutrition() {
  return {
    code: 'quest',
    product: {
      brands: 'Quest Nutrition',
      code: 'quest',
      number_of_servings: 8,
      product_name: 'Protein Chips',
      serving_quantity: 32,
      serving_quantity_unit: 'g',
      serving_size: '32 g',
      nutriments: {
        'energy-kcal_100g': 437.5,
        proteins_100g: 62.5,
        carbohydrates_100g: 12.5,
        fat_100g: 14.0625,
        fiber_100g: 3.125,
        sugars_100g: 3.125,
        sodium_100g: 1,
      },
    },
  };
}
