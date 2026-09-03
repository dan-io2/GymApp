import type { FoodSearchResult } from '../types/foodSearchTypes';

export type RankedFoodSearchResult = FoodSearchResult & {
  rankScore?: number;
};

const TYPO_CORRECTIONS: Record<string, string> = {
  bananna: 'banana',
  brest: 'breast',
  chiken: 'chicken',
  chipolte: 'chipotle',
  otu: 'out',
  nugits: 'nuggets',
  protien: 'protein',
  rce: 'rice',
  yogrt: 'yogurt',
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getCorrectedQuery(query: string): string | null {
  const normalized = normalizeSearchText(query);
  const corrected = normalized
    .split(' ')
    .map((token) => TYPO_CORRECTIONS[token] ?? token)
    .join(' ');

  return corrected !== normalized ? corrected : null;
}

const RESTAURANT_TERMS = [
  'burger king',
  'chick fil a',
  'chipotle',
  'in n out',
  'mcdonald',
  'starbucks',
  'subway',
  'taco bell',
];

export function rankFoodResults({
  providerResults = [],
  query,
  recentResults = [],
}: {
  providerResults?: FoodSearchResult[];
  query: string;
  recentResults?: FoodSearchResult[];
}): FoodSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const correctedQuery = getCorrectedQuery(query);
  const candidates = dedupeResults([...recentResults, ...providerResults]);

  if (!normalizedQuery) {
    return recentResults.slice(0, 8);
  }

  return candidates
    .map((food) => ({
      food,
      score:
        scoreFood(food, normalizedQuery) +
        (correctedQuery ? scoreFood(food, correctedQuery) * 0.95 : 0) +
        (recentResults.some((recent) => getFoodKey(recent) === getFoodKey(food)) ? 35 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ food }) => food);
}

function scoreFood(food: FoodSearchResult, query: string): number {
  const haystack = normalizeSearchText(`${food.name} ${food.brand ?? ''}`);
  const brand = normalizeSearchText(food.brand ?? '');

  if (!query || !haystack) {
    return 0;
  }

  if (haystack === query) {
    return 120;
  }

  if (haystack.startsWith(query)) {
    return 100;
  }

  if (haystack.includes(query)) {
    return 85;
  }

  const queryTokens = query.split(' ');
  const haystackTokens = haystack.split(' ');
  const tokenScore = queryTokens.reduce((score, queryToken) => {
    const bestTokenScore = Math.max(
      ...haystackTokens.map((token) => scoreToken(queryToken, token)),
      0,
    );

    return score + bestTokenScore;
  }, 0);

  const restaurantIntent = hasRestaurantIntent(query);
  const genericIntent = hasGenericIntent(query);
  const brandMatch = brand.length > 0 && query.includes(brand);
  let providerBoost = 0;

  if (food.source === 'fatsecret') {
    providerBoost += restaurantIntent || brandMatch ? 55 : 12;
  }

  if (food.source === 'usda') {
    providerBoost += genericIntent && !restaurantIntent ? 35 : 5;
  }

  if (food.source === 'open_food_facts') {
    providerBoost += brandMatch ? 28 : 2;
  }

  return tokenScore / queryTokens.length + providerBoost + (brandMatch ? 30 : 0);
}

function scoreToken(queryToken: string, candidateToken: string): number {
  if (candidateToken === queryToken) {
    return 80;
  }

  if (candidateToken.startsWith(queryToken)) {
    return 70;
  }

  if (candidateToken.includes(queryToken)) {
    return 55;
  }

  const distance = levenshteinDistance(queryToken, candidateToken);
  const maxLength = Math.max(queryToken.length, candidateToken.length);
  const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength;

  return similarity >= 0.72 ? similarity * 60 : 0;
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

function dedupeResults(results: FoodSearchResult[]): FoodSearchResult[] {
  const seen = new Set<string>();

  return results.filter((food) => {
    const key = getFoodKey(food);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getFoodKey(food: FoodSearchResult): string {
  if (food.barcode) {
    return `barcode:${food.barcode}`;
  }

  return `${food.source}:${food.externalId}`;
}

function hasRestaurantIntent(query: string): boolean {
  return RESTAURANT_TERMS.some((term) => query.includes(term));
}

function hasGenericIntent(query: string): boolean {
  return ['apple', 'banana', 'beef', 'chicken breast', 'egg', 'oats', 'rice'].some(
    (term) => query === term || query.includes(term),
  );
}
