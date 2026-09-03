import type { NormalizedFoodResult } from './food-types.ts';

const RESTAURANT_TERMS = [
  'burger king',
  'chick fil a',
  'chick-fil-a',
  'chipotle',
  'in n out',
  'in-n-out',
  'mcdonald',
  'mcdonalds',
  "mcdonald's",
  'starbucks',
  'subway',
  'taco bell',
];

const GENERIC_TERMS = ['apple', 'banana', 'beef', 'chicken breast', 'egg', 'oats', 'rice'];

export function rankProviderResults({
  foods,
  query,
}: {
  foods: NormalizedFoodResult[];
  query: string;
}): NormalizedFoodResult[] {
  const normalizedQuery = normalizeSearchText(query);

  return dedupeProviderResults(foods)
    .map((food) => ({
      food,
      score: scoreFood(food, normalizedQuery),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ food }) => food)
    .slice(0, 24);
}

export function dedupeProviderResults(foods: NormalizedFoodResult[]): NormalizedFoodResult[] {
  const seen = new Set<string>();

  return foods.filter((food) => {
    const keys = [
      `${food.source}:${food.externalId}`,
      food.barcode ? `barcode:${food.barcode}` : null,
      `${food.source}:${normalizeSearchText(food.name)}:${normalizeSearchText(food.brand ?? '')}:${
        food.servingDescription ?? ''
      }`,
    ].filter((key): key is string => key !== null);

    if (keys.some((key) => seen.has(key))) {
      return false;
    }

    keys.forEach((key) => seen.add(key));
    return true;
  });
}

function scoreFood(food: NormalizedFoodResult, query: string): number {
  const name = normalizeSearchText(food.name);
  const brand = normalizeSearchText(food.brand ?? '');
  const haystack = `${name} ${brand}`.trim();

  if (!query || !haystack) {
    return 0;
  }

  let score = 0;

  if (haystack === query) {
    score += 140;
  } else if (haystack.startsWith(query) || name.startsWith(query)) {
    score += 115;
  } else if (haystack.includes(query)) {
    score += 95;
  }

  const queryTokens = query.split(' ');
  const haystackTokens = haystack.split(' ');
  const tokenScore = queryTokens.reduce((total, queryToken) => {
    const best = Math.max(...haystackTokens.map((token) => scoreToken(queryToken, token)), 0);
    return total + best;
  }, 0);

  score += tokenScore / queryTokens.length;

  const restaurantIntent = RESTAURANT_TERMS.some((term) => query.includes(term));
  const genericIntent = GENERIC_TERMS.some((term) => query === term || query.includes(term));
  const brandTokens = brand.split(' ');
  const matchingBrandTokens = brandTokens.filter((brandToken) =>
    queryTokens.some((queryToken) => queryToken === brandToken),
  );
  const brandMatch = matchingBrandTokens.length > 0;
  const nameMatchCount = queryTokens.filter((queryToken) =>
    name.split(' ').some((nameToken) => nameToken === queryToken),
  ).length;

  if (food.source === 'fatsecret') {
    score += restaurantIntent || brandMatch ? 75 : 12;
  }

  if (food.source === 'usda') {
    score += genericIntent && !restaurantIntent ? 35 : 5;
  }

  if (food.source === 'open_food_facts') {
    score += brandMatch ? 28 : 2;
  }

  if (brandMatch) {
    score += matchingBrandTokens.length * 70;
  }

  if (restaurantIntent && food.source === 'fatsecret' && nameMatchCount > 0) {
    score += 45;
  }

  return score;
}

function scoreToken(queryToken: string, candidateToken: string): number {
  if (candidateToken === queryToken) {
    return 80;
  }

  if (candidateToken.startsWith(queryToken)) {
    return 65;
  }

  if (candidateToken.includes(queryToken)) {
    return 48;
  }

  const distance = levenshteinDistance(queryToken, candidateToken);
  const maxLength = Math.max(queryToken.length, candidateToken.length);
  const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength;

  return similarity >= 0.72 ? similarity * 55 : 0;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(left: string, right: string): number {
  const distances = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previous = distances[0];
    distances[0] = rightIndex;

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = distances[leftIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      distances[leftIndex] = Math.min(
        distances[leftIndex] + 1,
        distances[leftIndex - 1] + 1,
        previous + cost,
      );
      previous = current;
    }
  }

  return distances[left.length];
}
