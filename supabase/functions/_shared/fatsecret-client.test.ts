import {
  fetchFatSecretJson,
  getFatSecretAccessToken,
  resetFatSecretTokenCacheForTests,
} from './fatsecret-client.ts';
import type { ServerEnvKey } from './server-env.ts';

Deno.test('FatSecret OAuth uses server-side credentials and caches tokens', async () => {
  resetFatSecretTokenCacheForTests();
  const requests: Request[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init));

    return new Response(
      JSON.stringify({
        access_token: 'token-one',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  const readEnv = (key: ServerEnvKey) =>
    ({
      FATSECRET_CLIENT_ID: 'client-id',
      FATSECRET_CLIENT_SECRET: 'client-secret',
    })[key];

  const firstToken = await getFatSecretAccessToken({ fetchFn, nowMs: 1000, readEnv });
  const secondToken = await getFatSecretAccessToken({ fetchFn, nowMs: 2000, readEnv });

  if (firstToken !== 'token-one' || secondToken !== 'token-one') {
    throw new Error('Expected cached FatSecret token to be reused.');
  }

  if (requests.length !== 1) {
    throw new Error('Expected only one FatSecret token request before expiry.');
  }

  const authHeader = requests[0].headers.get('authorization');

  if (!authHeader?.startsWith('Basic ')) {
    throw new Error('Expected client credentials to be sent through Basic auth.');
  }
});

Deno.test('FatSecret OAuth refreshes expired cached tokens', async () => {
  resetFatSecretTokenCacheForTests();
  let count = 0;
  const fetchFn = (async () => {
    count += 1;

    return new Response(
      JSON.stringify({
        access_token: `token-${count}`,
        expires_in: 120,
        token_type: 'Bearer',
      }),
      { status: 200 },
    );
  }) as typeof fetch;
  const readEnv = (key: ServerEnvKey) =>
    ({
      FATSECRET_CLIENT_ID: 'client-id',
      FATSECRET_CLIENT_SECRET: 'client-secret',
    })[key];

  const firstToken = await getFatSecretAccessToken({ fetchFn, nowMs: 1000, readEnv });
  const secondToken = await getFatSecretAccessToken({ fetchFn, nowMs: 90_000, readEnv });

  if (firstToken !== 'token-1' || secondToken !== 'token-2') {
    throw new Error('Expected expired FatSecret token to be refreshed.');
  }
});

Deno.test('FatSecret API error payloads become provider diagnostics', async () => {
  const fetchFn = (async () =>
    new Response(
      JSON.stringify({
        error: {
          code: 14,
          message: 'Missing scope: premier',
        },
      }),
      { status: 200 },
    )) as typeof fetch;

  try {
    await fetchFatSecretJson({
      accessToken: 'token',
      fetchFn,
      path: '/foods/search/v5',
      searchParams: {
        search_expression: 'Big Mac',
      },
    });
  } catch (error) {
    const diagnostic = (error as { diagnostic?: { code?: string; message?: string } }).diagnostic;

    if (diagnostic?.code !== 'PROVIDER_AUTH_FAILED') {
      throw new Error('Expected FatSecret provider auth errors to be surfaced.');
    }

    if (diagnostic.message !== 'FatSecret error: Missing scope: premier') {
      throw new Error('Expected FatSecret error message to be sanitized and preserved.');
    }

    return;
  }

  throw new Error('Expected FatSecret API error payload to throw.');
});
