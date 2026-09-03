import { rankProviderResults } from './provider-ranking.ts';
import type { NormalizedFoodResult } from './food-types.ts';

Deno.test('restaurant brand tokens outrank unrelated USDA packaged matches', () => {
  const ranked = rankProviderResults({
    query: 'chipotle chicken',
    foods: [
      createFood('CHIPOTLE CHICKEN', 'Harvest Food Group, Inc.', 'usda'),
      createFood('Chicken', 'Chipotle Mexican Grill', 'fatsecret'),
    ],
  });

  if (ranked[0]?.source !== 'fatsecret') {
    throw new Error('Expected the matching FatSecret restaurant result to rank first.');
  }
});

Deno.test('generic chicken breast queries keep USDA results ahead', () => {
  const ranked = rankProviderResults({
    query: 'chicken breast',
    foods: [
      createFood('Chicken Breast', null, 'fatsecret'),
      createFood('Chicken Breast', null, 'usda'),
    ],
  });

  if (ranked[0]?.source !== 'usda') {
    throw new Error('Expected USDA to remain preferred for a generic query.');
  }
});

function createFood(
  name: string,
  brand: string | null,
  source: NormalizedFoodResult['source'],
): NormalizedFoodResult {
  return {
    id: null,
    externalId: `${source}-${name}-${brand ?? 'generic'}`,
    source,
    sourceLabel: source,
    barcode: null,
    name,
    brand,
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
  };
}
