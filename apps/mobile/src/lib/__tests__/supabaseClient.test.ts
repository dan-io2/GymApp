import { createSupabaseClient } from '../supabaseClient';

describe('createSupabaseClient', () => {
  it('constructs a Supabase client without making network requests', () => {
    const client = createSupabaseClient({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
    });

    expect(client.auth).toBeDefined();
    expect(client.from).toEqual(expect.any(Function));
  });
});
