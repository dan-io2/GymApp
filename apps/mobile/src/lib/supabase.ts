import { getMobileEnv } from './env';
import { createSupabaseClient, registerSupabaseAppStateHandler } from './supabaseClient';

export const supabase = createSupabaseClient(getMobileEnv());

registerSupabaseAppStateHandler(supabase);
