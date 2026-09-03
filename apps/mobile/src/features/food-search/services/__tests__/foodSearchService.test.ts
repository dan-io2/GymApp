import { createFoodSearchService, FoodSearchError } from '../foodSearchService';
import type { FoodSearchResult } from '../../types/foodSearchTypes';

type FoodSearchSupabaseClient = Parameters<typeof createFoodSearchService>[0];
type ClientMock = FoodSearchSupabaseClient & {
  functions: {
    invoke: jest.Mock;
  };
};

describe('foodSearchService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('searches foods through the Supabase Edge Function contract', async () => {
    const client = createClientMock({
      foods: [createFoodResult()],
    });
    const service = createFoodSearchService(client);

    await expect(service.searchFoods('chicken breast')).resolves.toEqual([createFoodResult()]);

    expect(client.functions.invoke).toHaveBeenCalledWith('search-food', {
      body: { query: 'chicken breast' },
    });
  });

  it('looks up barcode results without stripping leading zeroes', async () => {
    const food = createFoodResult({
      barcode: '012345678905',
      externalId: '012345678905',
      source: 'open_food_facts',
      sourceLabel: 'Open Food Facts',
    });
    const client = createClientMock({ food });
    const service = createFoodSearchService(client);

    await expect(service.lookupBarcode('012345678905')).resolves.toEqual(food);

    expect(client.functions.invoke).toHaveBeenCalledWith('lookup-barcode', {
      body: { barcode: '012345678905' },
    });
  });

  it('looks up USDA foods by provider id', async () => {
    const food = createFoodResult({ externalId: '2646170' });
    const client = createClientMock({ food });
    const service = createFoodSearchService(client);

    await expect(
      service.lookupProviderId({
        externalId: '2646170',
        provider: 'usda',
      }),
    ).resolves.toEqual(food);

    expect(client.functions.invoke).toHaveBeenCalledWith('lookup-food-id', {
      body: {
        externalId: '2646170',
        provider: 'usda',
      },
    });
  });

  it('loads autocomplete suggestions through the dedicated Edge Function', async () => {
    const client = createClientMock({ suggestions: ['Chipotle Chicken'] });
    const service = createFoodSearchService(client);

    await expect(service.autocompleteFoods('chip')).resolves.toEqual(['Chipotle Chicken']);

    expect(client.functions.invoke).toHaveBeenCalledWith('autocomplete-food', {
      body: { query: 'chip' },
    });
  });

  it('surfaces provider error messages returned by Edge Functions', async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: 'RATE_LIMITED',
          message: 'USDA FoodData Central is rate limited. Please try again later.',
        },
      }),
      { status: 429 },
    );
    const client = createClientMock({
      error: {
        context: response,
        message: 'Edge Function returned a non-2xx status code',
      },
    });
    const service = createFoodSearchService(client);

    await expect(service.searchFoods('oats')).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      message: 'USDA FoodData Central is rate limited. Please try again later.',
    });
  });

  it('uses a clear error when lookup responses do not include a normalized food', async () => {
    const client = createClientMock({ food: undefined });
    const service = createFoodSearchService(client);

    await expect(service.lookupBarcode('012345678905')).rejects.toBeInstanceOf(FoodSearchError);
  });
});

function createClientMock({
  error = null,
  food,
  foods,
  suggestions,
}: {
  error?: unknown;
  food?: FoodSearchResult;
  foods?: FoodSearchResult[];
  suggestions?: string[];
}): ClientMock {
  return {
    functions: {
      invoke: jest.fn().mockImplementation((functionName: string) =>
        Promise.resolve({
          data:
            functionName === 'search-food'
              ? {
                  foods: foods ?? [],
                }
              : functionName === 'autocomplete-food'
                ? {
                    suggestions: suggestions ?? [],
                  }
                : {
                    food,
                  },
          error,
        }),
      ),
    },
  } as unknown as ClientMock;
}

function createFoodResult(overrides: Partial<FoodSearchResult> = {}): FoodSearchResult {
  return {
    id: null,
    externalId: '2646170',
    source: 'usda',
    sourceLabel: 'USDA FoodData Central',
    barcode: null,
    name: 'Chicken Breast',
    brand: null,
    servingSize: 100,
    servingUnit: 'g',
    servingDescription: null,
    servingsPerContainer: null,
    servingBasis: 'per_100g',
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    fiberG: null,
    sugarG: null,
    sodiumMg: 74,
    ...overrides,
  };
}
