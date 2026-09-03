import { supabase } from '@/lib/supabase';
import type { Database, Tables } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export type UserProfile = Pick<Tables<'profiles'>, 'id'> & {
  onboardingCompleted: boolean;
  preferredUnitSystem: 'imperial' | 'metric';
};

export class ProfileQueryError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ProfileQueryError';
  }
}

export type ProfileService = {
  getCurrentUserProfile: (userId: string) => Promise<UserProfile | null>;
};

export function createProfileService(client: SupabaseClient<Database>): ProfileService {
  return {
    async getCurrentUserProfile(userId) {
      const { data, error } = await client
        .from('profiles')
        .select('id, onboarding_completed, preferred_unit_system')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw new ProfileQueryError('Unable to load your profile. Please try again.', error.code);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        onboardingCompleted: data.onboarding_completed,
        preferredUnitSystem: data.preferred_unit_system === 'metric' ? 'metric' : 'imperial',
      };
    },
  };
}

export const profileService = createProfileService(supabase);
