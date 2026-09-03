import { z } from 'npm:zod@4.4.3';

import { fetchFatSecretJson, getFatSecretAccessToken } from '../_shared/fatsecret-client.ts';
import { normalizeFatSecretFoodResponse } from '../_shared/fatsecret-adapter.ts';
import { jsonResponse, optionsResponse, providerErrorResponse } from '../_shared/http.ts';
import { getUsdaServerConfig, ServerConfigurationError } from '../_shared/server-env.ts';
import { normalizeUsdaDetailFood } from '../_shared/usda-adapter.ts';
import { isValidFdcId, normalizeFdcId } from '../_shared/validation.ts';

const requestSchema = z.object({
  provider: z.union([z.literal('usda'), z.literal('fatsecret')]),
  externalId: z.string(),
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (request.method !== 'POST') {
    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Provider ID lookup requests must use POST.',
      provider: 'usda',
      status: 405,
    });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !isValidFdcId(parsed.data.externalId)) {
    return providerErrorResponse({
      code: 'INVALID_FDC_ID',
      message:
        parsed.success && parsed.data.provider === 'fatsecret'
          ? 'Enter a valid FatSecret Food ID.'
          : 'Enter a valid USDA FDC ID.',
      provider: parsed.success ? parsed.data.provider : 'usda',
      status: 400,
    });
  }

  const externalId = normalizeFdcId(parsed.data.externalId);

  if (parsed.data.provider === 'fatsecret') {
    return lookupFatSecretFood(externalId);
  }

  let apiKey: string;

  try {
    apiKey = getUsdaServerConfig().fdcApiKey;
  } catch (error) {
    if (error instanceof ServerConfigurationError) {
      return providerErrorResponse({
        code: 'MISSING_USDA_API_KEY',
        message: error.message,
        provider: 'usda',
        status: 500,
      });
    }

    throw error;
  }

  const url = new URL(`https://api.nal.usda.gov/fdc/v1/food/${externalId}`);
  url.searchParams.set('api_key', apiKey);

  const providerResponse = await fetch(url).catch(() => null);

  if (!providerResponse) {
    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Unable to connect to USDA FoodData Central.',
      provider: 'usda',
      status: 503,
    });
  }

  if (providerResponse.status === 404) {
    return providerErrorResponse({
      code: 'FOOD_NOT_FOUND',
      message: "We couldn't find a USDA food with that FDC ID.",
      provider: 'usda',
      status: 404,
    });
  }

  if (providerResponse.status === 429) {
    return providerErrorResponse({
      code: 'RATE_LIMITED',
      message: 'USDA FoodData Central is rate limited. Please try again later.',
      provider: 'usda',
      status: 429,
    });
  }

  if (!providerResponse.ok) {
    console.info('[GymApp provider]', {
      externalId,
      provider: 'usda',
      requestType: 'lookup-food-id',
      status: providerResponse.status,
    });

    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'USDA FoodData Central is unavailable. Please try again.',
      provider: 'usda',
      status: 502,
    });
  }

  const body = await providerResponse.json().catch(() => null);
  const food = body ? normalizeUsdaDetailFood(body) : null;

  if (!food) {
    return providerErrorResponse({
      code: 'INVALID_PROVIDER_RESPONSE',
      message: 'USDA returned a food we could not normalize.',
      provider: 'usda',
      status: 502,
    });
  }

  return jsonResponse({ food });
});

async function lookupFatSecretFood(externalId: string): Promise<Response> {
  try {
    const accessToken = await getFatSecretAccessToken();
    const body = await fetchFatSecretJson({
      accessToken,
      path: '/food/v5',
      searchParams: {
        flag_default_serving: 'true',
        food_id: externalId,
        region: 'US',
      },
    });
    const food = normalizeFatSecretFoodResponse(
      body as Parameters<typeof normalizeFatSecretFoodResponse>[0],
    );

    if (!food) {
      return providerErrorResponse({
        code: 'INVALID_PROVIDER_RESPONSE',
        message: 'FatSecret returned a food we could not normalize.',
        provider: 'fatsecret',
        status: 502,
      });
    }

    return jsonResponse({ food });
  } catch (error) {
    const diagnostic = (error as { diagnostic?: Parameters<typeof providerErrorResponse>[0] })
      .diagnostic;

    if (diagnostic) {
      return providerErrorResponse(diagnostic);
    }

    throw error;
  }
}
