import type { FoodProviderErrorBody, FoodProviderErrorCode, ProviderSource } from './food-types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}

export function providerErrorResponse({
  code,
  message,
  provider,
  status,
}: {
  code: FoodProviderErrorCode;
  message: string;
  provider: ProviderSource;
  status: number;
}): Response {
  const body: FoodProviderErrorBody = {
    error: {
      code,
      message,
      provider,
      status,
    },
  };

  return jsonResponse(body, status);
}

export function optionsResponse(): Response {
  return new Response('ok', {
    headers: corsHeaders,
  });
}
