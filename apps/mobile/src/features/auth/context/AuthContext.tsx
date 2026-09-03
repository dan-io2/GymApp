import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authService as defaultAuthService } from '../services/authService';
import type { AuthService } from '../types/authTypes';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  signIn: AuthService['signIn'];
  signUp: AuthService['signUp'];
  signOut: AuthService['signOut'];
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
  service?: AuthService;
};

export function AuthProvider({ children, service = defaultAuthService }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const restoredSession = await service.getSession();

        if (isMounted) {
          setSession(restoredSession);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    const subscription = service.observeAuthState((_event, nextSession) => {
      setSession(nextSession);
      setIsInitializing(false);
    });

    restoreSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [service]);

  const signIn = useCallback<AuthService['signIn']>(
    (input) => {
      return service.signIn(input);
    },
    [service],
  );

  const signUp = useCallback<AuthService['signUp']>(
    (input) => {
      return service.signUp(input);
    },
    [service],
  );

  const signOut = useCallback<AuthService['signOut']>(() => {
    return service.signOut();
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isInitializing,
      signIn,
      signUp,
      signOut,
    }),
    [isInitializing, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
