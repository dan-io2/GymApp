import {
  getFatSecretServerConfig,
  getUsdaServerConfig,
  ServerConfigurationError,
  type ServerEnvKey,
} from './server-env.ts';

function createReader(values: Partial<Record<ServerEnvKey, string>>) {
  return (key: ServerEnvKey) => values[key];
}

Deno.test('getFatSecretServerConfig returns trimmed client credentials', () => {
  const config = getFatSecretServerConfig(
    createReader({
      FATSECRET_CLIENT_ID: ' client-id ',
      FATSECRET_CLIENT_SECRET: ' client-secret ',
    }),
  );

  if (config.clientId !== 'client-id') {
    throw new Error('Expected FatSecret client id to be read from server env.');
  }

  if (config.clientSecret !== 'client-secret') {
    throw new Error('Expected FatSecret client secret to be read from server env.');
  }
});

Deno.test('getFatSecretServerConfig fails with missing variable names only', () => {
  try {
    getFatSecretServerConfig(createReader({ FATSECRET_CLIENT_ID: 'client-id' }));
  } catch (error) {
    if (!(error instanceof ServerConfigurationError)) {
      throw new Error('Expected missing FatSecret config to throw ServerConfigurationError.');
    }

    if (error.message !== 'Missing required server configuration: FATSECRET_CLIENT_SECRET.') {
      throw new Error('Expected missing config message to include only missing variable names.');
    }

    return;
  }

  throw new Error('Expected missing FatSecret client secret to throw.');
});

Deno.test('getUsdaServerConfig keeps existing USDA secret contract', () => {
  const config = getUsdaServerConfig(createReader({ USDA_FDC_API_KEY: ' usda-key ' }));

  if (config.fdcApiKey !== 'usda-key') {
    throw new Error('Expected USDA API key to be read from server env.');
  }
});
