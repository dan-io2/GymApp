import { z } from 'npm:zod@4.4.3';

import type { FoodProviderDiagnostic, NormalizedFoodResult } from '../_shared/food-types.ts';
import { fetchFatSecretJson, getFatSecretAccessToken } from '../_shared/fatsecret-client.ts';
import { normalizeFatSecretSearchResponse } from '../_shared/fatsecret-adapter.ts';
import { jsonResponse, optionsResponse, providerErrorResponse } from '../_shared/http.ts';
import { rankProviderResults } from '../_shared/provider-ranking.ts';
import { getUsdaServerConfig, ServerConfigurationError } from '../_shared/server-env.ts';
import { normalizeUsdaSearchFood } from '../_shared/usda-adapter.ts';
import { isValidSearchQuery, normalizeSearchQuery } from '../_shared/validation.ts';

const requestSchema = z.object({
  query: z.string(),
  page: z.number().int().min(0).optional(),
  maxResults: z.number().int().min(1).max(24).optional(),
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (request.method !== 'POST') {
    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Search requests must use POST.',
      provider: 'usda',
      status: 405,
    });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !isValidSearchQuery(parsed.data.query)) {
    return providerErrorResponse({
      code: 'INVALID_QUERY',
      message: 'Enter at least two characters to search foods.',
      provider: 'usda',
      status: 400,
    });
  }

  const query = normalizeSearchQuery(parsed.data.query);
  const page = parsed.data.page ?? 0;
  const maxResults = parsed.data.maxResults ?? 12;
  const providerResults = await Promise.allSettled([
    searchFatSecretFoods({ maxResults, page, query }),
    searchUsdaFoods({ maxResults, query }),
  ]);
  const foods: NormalizedFoodResult[] = [];
  const diagnostics: FoodProviderDiagnostic[] = [];

  for (const result of providerResults) {
    if (result.status === 'fulfilled') {
      foods.push(...result.value.foods);
      diagnostics.push(...result.value.diagnostics);
      continue;
    }

    diagnostics.push(toDiagnostic(result.reason));
  }

  const rankedFoods = rankProviderResults({ foods, query });

  if (rankedFoods.length === 0 && diagnostics.length === providerResults.length) {
    return providerErrorResponse({
      code: diagnostics[0]?.code ?? 'PROVIDER_UNAVAILABLE',
      message: "We couldn't search foods right now. Please try again.",
      provider: diagnostics[0]?.provider ?? 'usda',
      status: diagnostics[0]?.status ?? 503,
    });
  }

  return jsonResponse({ diagnostics, foods: rankedFoods });
});

async function searchFatSecretFoods({
  maxResults,
  page,
  query,
}: {
  maxResults: number;
  page: number;
  query: string;
}): Promise<{ diagnostics: FoodProviderDiagnostic[]; foods: NormalizedFoodResult[] }> {
  const accessToken = await getFatSecretAccessToken();
  const body = await fetchFatSecretJson({
    accessToken,
    path: '/foods/search/v5',
    searchParams: {
      flag_default_serving: 'true',
      max_results: maxResults.toString(),
      page_number: page.toString(),
      region: 'US',
      search_expression: query,
    },
  });

  return {
    diagnostics: [],
    foods: normalizeFatSecretSearchResponse(
      body as Parameters<typeof normalizeFatSecretSearchResponse>[0],
    ),
  };
}

async function searchUsdaFoods({
  maxResults,
  query,
}: {
  maxResults: number;
  query: string;
}): Promise<{ diagnostics: FoodProviderDiagnostic[]; foods: NormalizedFoodResult[] }> {
  let apiKey: string;

  try {
    apiKey = getUsdaServerConfig().fdcApiKey;
  } catch (error) {
    if (error instanceof ServerConfigurationError) {
      return {
        diagnostics: [
          {
            code: 'MISSING_USDA_API_KEY',
            message: error.message,
            provider: 'usda',
            status: 500,
          },
        ],
        foods: [],
      };
    }

    throw error;
  }

  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('api_key', apiKey);

  const providerResponse = await fetch(url, {
    body: JSON.stringify({
      query,
      pageSize: maxResults,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  }).catch(() => null);

  if (!providerResponse) {
    throw {
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Unable to connect to USDA FoodData Central.',
      provider: 'usda',
      status: 503,
    } satisfies FoodProviderDiagnostic;
  }

  if (providerResponse.status === 429) {
    throw {
      code: 'RATE_LIMITED',
      message: 'USDA FoodData Central is rate limited. Please try again later.',
      provider: 'usda',
      status: 429,
    } satisfies FoodProviderDiagnostic;
  }

  if (!providerResponse.ok) {
    console.info('[GymApp provider]', {
      provider: 'usda',
      requestType: 'search',
      status: providerResponse.status,
    });

    throw {
      code: 'PROVIDER_UNAVAILABLE',
      message: 'USDA FoodData Central is unavailable. Please try again.',
      provider: 'usda',
      status: 502,
    } satisfies FoodProviderDiagnostic;
  }

  const body = await providerResponse.json().catch(() => null);
  const foods = Array.isArray(body?.foods)
    ? body.foods.map(normalizeUsdaSearchFood).filter(Boolean)
    : [];

  return { diagnostics: [], foods };
}

function toDiagnostic(error: unknown): FoodProviderDiagnostic {
  const diagnostic = (error as { diagnostic?: FoodProviderDiagnostic }).diagnostic;

  if (diagnostic) {
    return diagnostic;
  }

  const maybeDiagnostic = error as Partial<FoodProviderDiagnostic>;

  return {
    code: maybeDiagnostic.code ?? 'PROVIDER_UNAVAILABLE',
    message: maybeDiagnostic.message ?? 'Food provider unavailable.',
    provider: maybeDiagnostic.provider ?? 'usda',
    status: maybeDiagnostic.status ?? 503,
  };
}
