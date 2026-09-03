import { parseMobileEnv } from '../env';

describe('parseMobileEnv', () => {
  it('returns validated Supabase public client configuration', () => {
    expect(
      parseMobileEnv({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
      }),
    ).toEqual({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
    });
  });

  it('throws a useful setup error when required values are missing', () => {
    expect(() => parseMobileEnv({})).toThrow(/Missing or invalid mobile environment configuration/);
  });
});
