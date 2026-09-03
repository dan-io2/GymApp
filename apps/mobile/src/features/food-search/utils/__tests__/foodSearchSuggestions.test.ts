import type { FoodSearchResult } from '../../types/foodSearchTypes';
import { getCorrectedQuery, normalizeSearchText, rankFoodResults } from '../foodSearchSuggestions';

describe('foodSearchSuggestions', () => {
  const foods = [
    createFood('Chicken breast, grilled'),
    createFood('Greek yogurt'),
    createFood('Banana'),
    createFood('Protein shake'),
    createFood('Protein Chips', { brand: 'Quest Nutrition', source: 'open_food_facts' }),
    createFood('Chicken', {
      brand: 'Chipotle',
      externalId: 'fatsecret-chipotle-chicken',
      source: 'fatsecret',
      sourceLabel: 'FatSecret',
    }),
    createFood('Jasmine rice'),
    createFood('Eggs'),
    createFood('Oats'),
  ];

  it.each([
    ['chiken brest', 'chicken breast', 'Chicken breast, grilled'],
    ['chipolte chiken', 'chipotle chicken', 'Chicken'],
    ['greek yogrt', 'greek yogurt', 'Greek yogurt'],
    ['bananna', 'banana', 'Banana'],
    ['protien', 'protein', 'Protein shake'],
    ['rce', 'rice', 'Jasmine rice'],
  ])('corrects %s to find %s', (query, corrected, expected) => {
    expect(getCorrectedQuery(query)).toBe(corrected);
    expect(rankFoodResults({ providerResults: foods, query })[0].name).toBe(expected);
  });

  it('normalizes capitalization, duplicate spaces, and punctuation', () => {
    expect(normalizeSearchText('  Chicken,,,   BREAST  ')).toBe('chicken breast');
  });

  it.each([
    ['chi', 'Chicken breast, grilled'],
    ['chick', 'Chicken breast, grilled'],
    ['prot', 'Protein shake'],
    ['yog', 'Greek yogurt'],
    ['ban', 'Banana'],
    ['ric', 'Jasmine rice'],
  ])('ranks useful partial query %s', (query, expected) => {
    expect(rankFoodResults({ providerResults: foods, query })[0].name).toBe(expected);
  });

  it('ranks recent foods above similar provider results', () => {
    const ranked = rankFoodResults({
      providerResults: [createFood('Chicken sandwich'), createFood('Chicken breast, raw')],
      query: 'chi',
      recentResults: [createFood('Chicken breast, grilled')],
    });

    expect(ranked[0].name).toBe('Chicken breast, grilled');
  });

  it('ranks restaurant FatSecret results above generic USDA for restaurant intent', () => {
    const ranked = rankFoodResults({
      providerResults: [
        createFood('Chicken Breast', { source: 'usda', sourceLabel: 'USDA FoodData Central' }),
        createFood('Chicken', {
          brand: 'Chipotle',
          externalId: 'fatsecret-chipotle-chicken',
          source: 'fatsecret',
          sourceLabel: 'FatSecret',
        }),
      ],
      query: 'chipotle chicken',
    });

    expect(ranked[0]).toMatchObject({
      brand: 'Chipotle',
      source: 'fatsecret',
    });
  });

  it.each(['in n out', 'in-n-out', 'In N Out', 'in n out burger', 'in n out fries'])(
    'recognizes free-text restaurant intent for %s',
    (query) => {
      const ranked = rankFoodResults({
        providerResults: [
          createFood('French Fries', {
            brand: 'In-N-Out Burger',
            externalId: `fatsecret-${query}`,
            source: 'fatsecret',
            sourceLabel: 'FatSecret',
          }),
          createFood('Burger', { source: 'usda', sourceLabel: 'USDA FoodData Central' }),
        ],
        query,
      });

      expect(ranked[0]).toMatchObject({ brand: 'In-N-Out Burger', source: 'fatsecret' });
    },
  );

  it('lets an unselected typo query reach a useful corrected restaurant result', () => {
    const ranked = rankFoodResults({
      providerResults: [
        createFood('Nuggets', {
          brand: 'Chick-fil-A',
          externalId: 'fatsecret-chick-fil-a-nuggets',
          source: 'fatsecret',
          sourceLabel: 'FatSecret',
        }),
      ],
      query: 'chick fil a nugits',
    });

    expect(ranked[0]).toMatchObject({ brand: 'Chick-fil-A', source: 'fatsecret' });
  });

  it('ranks an exact restaurant brand over an unrelated packaged USDA match', () => {
    const ranked = rankFoodResults({
      providerResults: [
        createFood('CHIPOTLE CHICKEN', {
          brand: 'Harvest Food Group, Inc.',
          externalId: 'usda-packaged-chipotle-chicken',
          source: 'usda',
          sourceLabel: 'USDA FoodData Central',
        }),
        createFood('Chicken', {
          brand: 'Chipotle Mexican Grill',
          externalId: 'fatsecret-chipotle-chicken',
          source: 'fatsecret',
          sourceLabel: 'FatSecret',
        }),
      ],
      query: 'chipotle chicken',
    });

    expect(ranked[0]).toMatchObject({ brand: 'Chipotle Mexican Grill', source: 'fatsecret' });
  });

  it('keeps strong generic USDA results high for generic intent', () => {
    const ranked = rankFoodResults({
      providerResults: [
        createFood('Chicken', {
          brand: 'Chipotle',
          externalId: 'fatsecret-chipotle-chicken',
          source: 'fatsecret',
          sourceLabel: 'FatSecret',
        }),
        createFood('Chicken Breast', { source: 'usda', sourceLabel: 'USDA FoodData Central' }),
      ],
      query: 'chicken breast',
    });

    expect(ranked[0]).toMatchObject({
      name: 'Chicken Breast',
      source: 'usda',
    });
  });

  it('dedupes duplicate FatSecret external IDs', () => {
    const ranked = rankFoodResults({
      providerResults: [
        createFood('Chicken', {
          brand: 'Chipotle',
          externalId: '123',
          source: 'fatsecret',
          sourceLabel: 'FatSecret',
        }),
        createFood('Chicken', {
          brand: 'Chipotle',
          externalId: '123',
          source: 'fatsecret',
          sourceLabel: 'FatSecret',
        }),
      ],
      query: 'chipotle chicken',
    });

    expect(ranked).toHaveLength(1);
  });

  it('returns recents for an empty query', () => {
    expect(
      rankFoodResults({
        providerResults: foods,
        query: '',
        recentResults: [createFood('Eggs'), createFood('Oats')],
      }).map((food) => food.name),
    ).toEqual(['Eggs', 'Oats']);
  });
});

function createFood(name: string, overrides: Partial<FoodSearchResult> = {}): FoodSearchResult {
  return {
    id: null,
    externalId: name,
    source: 'usda',
    sourceLabel: 'USDA FoodData Central',
    barcode: null,
    name,
    brand: null,
    servingSize: 100,
    servingUnit: 'g',
    servingDescription: null,
    servingsPerContainer: null,
    servingBasis: 'per_100g',
    calories: 100,
    proteinG: 10,
    carbsG: 10,
    fatG: 2,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    ...overrides,
  };
}
