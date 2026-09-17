import {
  normalizeFatSecretAutocompleteResponse,
  normalizeFatSecretFood,
  normalizeFatSecretFoodResponse,
  normalizeFatSecretSearchResponse,
} from './fatsecret-adapter.ts';
import {
  fatSecretAutocompleteFixture,
  fatSecretBigMacFoodFixture,
  fatSecretChipotleSearchFixture,
} from './fatsecret-fixtures.ts';

Deno.test('normalizes FatSecret restaurant search results and preserves servings', () => {
  const foods = normalizeFatSecretSearchResponse(fatSecretChipotleSearchFixture);

  if (foods.length !== 1) {
    throw new Error('Expected one normalized FatSecret food.');
  }

  const food = foods[0];

  if (food.source !== 'fatsecret' || food.brand !== 'Chipotle' || food.name !== 'Chicken') {
    throw new Error('Expected FatSecret source with restaurant brand preserved.');
  }

  if (food.calories !== 180 || food.proteinG !== 32 || food.sodiumMg !== 310) {
    throw new Error('Expected default serving nutrition to be normalized.');
  }

  if (food.servingOptions?.length !== 2) {
    throw new Error('Expected multiple FatSecret serving options to be preserved.');
  }
});

Deno.test('normalizes FatSecret food detail results', () => {
  const food = normalizeFatSecretFoodResponse(fatSecretBigMacFoodFixture);

  if (!food) {
    throw new Error('Expected normalized FatSecret detail food.');
  }

  if (food.brand !== "McDonald's" || food.name !== 'Big Mac') {
    throw new Error('Expected branded restaurant metadata to be preserved.');
  }

  if (food.servingDescription !== '1 burger' || food.calories !== 563) {
    throw new Error('Expected serving and calories to be normalized.');
  }
});

Deno.test('normalizes FatSecret autocomplete suggestions', () => {
  const suggestions = normalizeFatSecretAutocompleteResponse(fatSecretAutocompleteFixture);

  if (suggestions.join('|') !== 'Chipotle Chicken|Chipotle Chicken Bowl') {
    throw new Error('Expected FatSecret autocomplete suggestions.');
  }
});

Deno.test('creates unique stable identities when provider serving IDs collide', () => {
  const food = normalizeFatSecretFood({
    food_id: '1003',
    food_name: 'Chicken',
    brand_name: 'Chipotle',
    servings: {
      serving: [
        {
          serving_id: '0',
          serving_description: '1 serving',
          metric_serving_amount: '113',
          metric_serving_unit: 'g',
          calories: '180',
          protein: '32',
          carbohydrate: '0',
          fat: '7',
        },
        {
          serving_id: '0',
          serving_description: '1 oz',
          metric_serving_amount: '28.349523125',
          metric_serving_unit: 'g',
          calories: '45',
          protein: '8',
          carbohydrate: '0',
          fat: '2',
        },
        {
          serving_id: '0',
          serving_description: '100 g',
          metric_serving_amount: '100',
          metric_serving_unit: 'g',
          calories: '159',
          protein: '28.3',
          carbohydrate: '0',
          fat: '6.2',
        },
      ],
    },
  });

  if (!food || food.servingOptions?.length !== 3) {
    throw new Error('Expected three distinct FatSecret serving options.');
  }

  const ids = food.servingOptions.map((option) => option.id);

  if (new Set(ids).size !== ids.length || ids.some((id) => id === '0')) {
    throw new Error('Expected unique composite serving identities.');
  }
});
