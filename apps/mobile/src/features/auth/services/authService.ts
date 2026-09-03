import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from '../schemas/authSchemas';
import type { AuthService, AuthStateChangeCallback } from '../types/authTypes';
import { logAuthErrorDiagnostic, mapAuthError } from './authErrors';

export function createAuthService(client: SupabaseClient<Database>): AuthService {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession();

      if (error) {
        const authError = mapAuthError(error);
        logAuthErrorDiagnostic(error, 'getSession failed');
        throw authError;
      }

      return data.session;
    },

    observeAuthState(callback: AuthStateChangeCallback) {
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(callback);

      return {
        unsubscribe: () => subscription.unsubscribe(),
      };
    },

    async signIn(input: SignInInput) {
      const credentials = signInSchema.parse(input);
      const { error } = await client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        const authError = mapAuthError(error);
        logAuthErrorDiagnostic(error, 'signIn failed');
        throw authError;
      }
    },

    async signUp(input: SignUpInput) {
      const credentials = signUpSchema.parse(input);
      const { data, error } = await client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        const authError = mapAuthError(error);
        logAuthErrorDiagnostic(error, 'signUp failed');
        throw authError;
      }

      return {
        requiresEmailConfirmation: data.session === null,
      };
    },

    async signOut() {
      const { error } = await client.auth.signOut();

      if (error) {
        const authError = mapAuthError(error);
        logAuthErrorDiagnostic(error, 'signOut failed');
        throw authError;
      }
    },
  };
}

export const authService = createAuthService(supabase);
