export type ServerEnvKey = 'USDA_FDC_API_KEY' | 'FATSECRET_CLIENT_ID' | 'FATSECRET_CLIENT_SECRET';

export type ServerEnvReader = (key: ServerEnvKey) => string | undefined;

export type UsdaServerConfig = {
  fdcApiKey: string;
};

export type FatSecretServerConfig = {
  clientId: string;
  clientSecret: string;
};

export class ServerConfigurationError extends Error {
  readonly missingKeys: ServerEnvKey[];

  constructor(missingKeys: ServerEnvKey[]) {
    super(`Missing required server configuration: ${missingKeys.join(', ')}.`);
    this.name = 'ServerConfigurationError';
    this.missingKeys = missingKeys;
  }
}

function readDenoEnv(key: ServerEnvKey): string | undefined {
  return Deno.env.get(key);
}

function requireServerEnv(
  keys: ServerEnvKey[],
  readEnv: ServerEnvReader,
): Record<ServerEnvKey, string> {
  const values = {} as Record<ServerEnvKey, string>;
  const missingKeys: ServerEnvKey[] = [];

  for (const key of keys) {
    const value = readEnv(key)?.trim();

    if (!value) {
      missingKeys.push(key);
      continue;
    }

    values[key] = value;
  }

  if (missingKeys.length > 0) {
    throw new ServerConfigurationError(missingKeys);
  }

  return values;
}

export function getUsdaServerConfig(readEnv: ServerEnvReader = readDenoEnv): UsdaServerConfig {
  const values = requireServerEnv(['USDA_FDC_API_KEY'], readEnv);

  return {
    fdcApiKey: values.USDA_FDC_API_KEY,
  };
}

export function getFatSecretServerConfig(
  readEnv: ServerEnvReader = readDenoEnv,
): FatSecretServerConfig {
  const values = requireServerEnv(['FATSECRET_CLIENT_ID', 'FATSECRET_CLIENT_SECRET'], readEnv);

  return {
    clientId: values.FATSECRET_CLIENT_ID,
    clientSecret: values.FATSECRET_CLIENT_SECRET,
  };
}
