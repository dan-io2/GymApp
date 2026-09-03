import { z } from 'npm:zod@4.4.3';

import { jsonResponse, optionsResponse, providerErrorResponse } from '../_shared/http.ts';
import { normalizeOpenFoodFactsProduct } from '../_shared/open-food-facts-adapter.ts';
import { isValidBarcode, normalizeBarcode } from '../_shared/validation.ts';

const requestSchema = z.object({
  barcode: z.string(),
});

const OPEN_FOOD_FACTS_USER_AGENT = 'GymApp/0.1 (development)';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (request.method !== 'POST') {
    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Barcode lookup requests must use POST.',
      provider: 'open_food_facts',
      status: 405,
    });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !isValidBarcode(parsed.data.barcode)) {
    return providerErrorResponse({
      code: 'INVALID_BARCODE',
      message: 'Enter a valid UPC or EAN barcode.',
      provider: 'open_food_facts',
      status: 400,
    });
  }

  const barcode = normalizeBarcode(parsed.data.barcode);
  const url = new URL(`https://world.openfoodfacts.org/api/v3/product/${barcode}`);
  url.searchParams.set(
    'fields',
    [
      'code',
      'product_name',
      'product_name_en',
      'brands',
      'number_of_servings',
      'serving_quantity',
      'serving_quantity_unit',
      'serving_size',
      'nutriments',
    ].join(','),
  );

  const providerResponse = await fetch(url, {
    headers: {
      'User-Agent': OPEN_FOOD_FACTS_USER_AGENT,
    },
  }).catch(() => null);

  if (!providerResponse) {
    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Unable to connect to Open Food Facts.',
      provider: 'open_food_facts',
      status: 503,
    });
  }

  if (providerResponse.status === 404) {
    return providerErrorResponse({
      code: 'PRODUCT_NOT_FOUND',
      message: "We couldn't find a product with that barcode.",
      provider: 'open_food_facts',
      status: 404,
    });
  }

  if (providerResponse.status === 429) {
    return providerErrorResponse({
      code: 'RATE_LIMITED',
      message: 'Open Food Facts is rate limited. Please try again later.',
      provider: 'open_food_facts',
      status: 429,
    });
  }

  if (!providerResponse.ok) {
    console.info('[GymApp provider]', {
      barcode,
      provider: 'open_food_facts',
      requestType: 'lookup-barcode',
      status: providerResponse.status,
    });

    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Open Food Facts is unavailable. Please try again.',
      provider: 'open_food_facts',
      status: 502,
    });
  }

  const body = await providerResponse.json().catch(() => null);
  const food = body ? normalizeOpenFoodFactsProduct(body) : null;

  if (!food) {
    return providerErrorResponse({
      code: 'PRODUCT_NOT_FOUND',
      message: "We couldn't find a product with that barcode.",
      provider: 'open_food_facts',
      status: 404,
    });
  }

  return jsonResponse({ food });
});
