import {
  normalizeFatSecretAutocompleteResponse,
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
