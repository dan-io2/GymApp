import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { MobileEnv } from './env';
import type { Database } from '@/types/database';

export function createSupabaseClient(config: MobileEnv): SupabaseClient<Database> {
  return createClient<Database>(
    config.EXPO_PUBLIC_SUPABASE_URL,
    config.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    },
  );
}

export function registerSupabaseAppStateHandler(client: SupabaseClient<Database>): void {
  if (Platform.OS === 'web') {
    return;
  }

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      client.auth.startAutoRefresh();
      return;
    }

    client.auth.stopAutoRefresh();
  });
}
