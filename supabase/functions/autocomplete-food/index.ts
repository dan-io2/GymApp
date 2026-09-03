import { z } from 'npm:zod@4.4.3';

import { fetchFatSecretJson, getFatSecretAccessToken } from '../_shared/fatsecret-client.ts';
import { normalizeFatSecretAutocompleteResponse } from '../_shared/fatsecret-adapter.ts';
import { jsonResponse, optionsResponse, providerErrorResponse } from '../_shared/http.ts';
import { isValidSearchQuery, normalizeSearchQuery } from '../_shared/validation.ts';

const requestSchema = z.object({
  query: z.string(),
  maxResults: z.number().int().min(1).max(10).optional(),
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (request.method !== 'POST') {
    return providerErrorResponse({
      code: 'PROVIDER_UNAVAILABLE',
      message: 'Autocomplete requests must use POST.',
      provider: 'fatsecret',
      status: 405,
    });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !isValidSearchQuery(parsed.data.query)) {
    return providerErrorResponse({
      code: 'INVALID_QUERY',
      message: 'Enter at least two characters to autocomplete foods.',
      provider: 'fatsecret',
      status: 400,
    });
  }

  try {
    const accessToken = await getFatSecretAccessToken();
    const body = await fetchFatSecretJson({
      accessToken,
      path: '/food/autocomplete/v2',
      searchParams: {
        expression: normalizeSearchQuery(parsed.data.query),
        max_results: (parsed.data.maxResults ?? 6).toString(),
        region: 'US',
      },
    });

    return jsonResponse({
      suggestions: normalizeFatSecretAutocompleteResponse(
        body as Parameters<typeof normalizeFatSecretAutocompleteResponse>[0],
      ),
    });
  } catch (error) {
    const diagnostic = (error as { diagnostic?: Parameters<typeof providerErrorResponse>[0] })
      .diagnostic;

    if (diagnostic) {
      return providerErrorResponse(diagnostic);
    }

    throw error;
  }
});
