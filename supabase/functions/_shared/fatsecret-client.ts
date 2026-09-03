import type { FoodProviderDiagnostic } from './food-types.ts';
import {
  getFatSecretServerConfig,
  ServerConfigurationError,
  type ServerEnvReader,
} from './server-env.ts';

const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_API_BASE_URL = 'https://platform.fatsecret.com/rest';
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

type CachedToken = {
  accessToken: string;
  expiresAtMs: number;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

type FatSecretErrorResponse = {
  error?: {
    code?: number | string;
    message?: string;
  };
};

export class FatSecretProviderError extends Error {
  readonly diagnostic: FoodProviderDiagnostic;

  constructor(message: string, diagnostic: FoodProviderDiagnostic) {
    super(message);
    this.name = 'FatSecretProviderError';
    this.diagnostic = diagnostic;
  }
}

let cachedToken: CachedToken | null = null;

export function resetFatSecretTokenCacheForTests() {
  cachedToken = null;
}

export async function getFatSecretAccessToken({
  fetchFn = fetch,
  nowMs = Date.now(),
  readEnv,
}: {
  fetchFn?: typeof fetch;
  nowMs?: number;
  readEnv?: ServerEnvReader;
} = {}): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs > nowMs) {
    return cachedToken.accessToken;
  }

  let config: ReturnType<typeof getFatSecretServerConfig>;

  try {
    config = getFatSecretServerConfig(readEnv);
  } catch (error) {
    if (error instanceof ServerConfigurationError) {
      throw createFatSecretError(error.message, 'MISSING_FATSECRET_CONFIG', 500);
    }

    throw error;
  }
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
  const response = await fetchFn(FATSECRET_TOKEN_URL, {
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'premier',
    }),
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  }).catch(() => null);

  if (!response) {
    throw createFatSecretError(
      'Unable to connect to FatSecret authentication.',
      'PROVIDER_AUTH_FAILED',
      503,
    );
  }

  if (!response.ok) {
    throw createFatSecretError('FatSecret authentication failed.', 'PROVIDER_AUTH_FAILED', 502);
  }

  const body = (await response.json().catch(() => null)) as TokenResponse | null;

  if (
    !body?.access_token ||
    body.token_type?.toLowerCase() !== 'bearer' ||
    !body.expires_in ||
    body.expires_in <= 0
  ) {
    throw createFatSecretError(
      'FatSecret authentication returned an invalid response.',
      'INVALID_PROVIDER_RESPONSE',
      502,
    );
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAtMs: nowMs + body.expires_in * 1000 - TOKEN_EXPIRY_MARGIN_MS,
  };

  return cachedToken.accessToken;
}

export async function fetchFatSecretJson({
  accessToken,
  fetchFn = fetch,
  path,
  searchParams,
}: {
  accessToken: string;
  fetchFn?: typeof fetch;
  path: string;
  searchParams: Record<string, string>;
}): Promise<unknown> {
  const url = new URL(`${FATSECRET_API_BASE_URL}${path}`);

  Object.entries({ ...searchParams, format: 'json' }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetchFn(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).catch(() => null);

  if (!response) {
    throw createFatSecretError('Unable to connect to FatSecret.', 'PROVIDER_UNAVAILABLE', 503);
  }

  if (response.status === 401 || response.status === 403) {
    resetFatSecretTokenCacheForTests();
    throw createFatSecretError('FatSecret authentication failed.', 'PROVIDER_AUTH_FAILED', 502);
  }

  if (response.status === 404) {
    throw createFatSecretError(
      "We couldn't find a FatSecret food with that ID.",
      'FOOD_NOT_FOUND',
      404,
    );
  }

  if (response.status === 429) {
    throw createFatSecretError(
      'FatSecret is rate limited. Please try again later.',
      'RATE_LIMITED',
      429,
    );
  }

  const body = await response.json().catch(() => {
    throw createFatSecretError(
      'FatSecret returned an invalid response.',
      'INVALID_PROVIDER_RESPONSE',
      502,
    );
  });

  const providerError = (body as FatSecretErrorResponse | null)?.error;

  if (providerError) {
    throw createFatSecretError(
      sanitizeFatSecretProviderMessage(providerError.message),
      mapFatSecretProviderErrorCode(providerError.code),
      response.ok ? 502 : response.status,
    );
  }

  if (!response.ok) {
    throw createFatSecretError('FatSecret is unavailable.', 'PROVIDER_UNAVAILABLE', 502);
  }

  return body;
}

export function createFatSecretError(
  message: string,
  code: FoodProviderDiagnostic['code'],
  status: number,
): FatSecretProviderError {
  return new FatSecretProviderError(message, {
    code,
    message,
    provider: 'fatsecret',
    status,
  });
}

function mapFatSecretProviderErrorCode(
  code: number | string | undefined,
): FoodProviderDiagnostic['code'] {
  const normalizedCode = code?.toString();

  if (normalizedCode === '13' || normalizedCode === '14') {
    return 'PROVIDER_AUTH_FAILED';
  }

  if (normalizedCode === '101' || normalizedCode === '107') {
    return 'INVALID_QUERY';
  }

  return 'PROVIDER_UNAVAILABLE';
}

function sanitizeFatSecretProviderMessage(message: string | undefined): string {
  const sanitized = message?.trim();

  return sanitized ? `FatSecret error: ${sanitized}` : 'FatSecret is unavailable.';
}
