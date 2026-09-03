import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import type { SignInInput, SignUpInput } from '../schemas/authSchemas';

export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

export type AuthSubscription = {
  unsubscribe: () => void;
};

export type AuthService = {
  getSession: () => Promise<Session | null>;
  observeAuthState: (callback: AuthStateChangeCallback) => AuthSubscription;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
};
