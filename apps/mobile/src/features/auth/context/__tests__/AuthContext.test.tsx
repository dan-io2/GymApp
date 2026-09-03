import type { Session } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from '../AuthContext';
import type { AuthService, AuthStateChangeCallback } from '../../types/authTypes';

describe('AuthProvider', () => {
  it('restores a persisted session on startup', async () => {
    const service = createServiceMock({
      restoredSession: createSessionMock('person@example.com'),
    });

    render(
      <AuthProvider service={service}>
        <SessionConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('loading')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('person@example.com')).toBeTruthy();
    });
  });

  it('unsubscribes from auth state changes on unmount', () => {
    const unsubscribe = jest.fn();
    const service = createServiceMock({ unsubscribe });

    const result = render(
      <AuthProvider service={service}>
        <SessionConsumer />
      </AuthProvider>,
    );

    result.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

function SessionConsumer() {
  const { isInitializing, user } = useAuth();

  if (isInitializing) {
    return <Text>loading</Text>;
  }

  return <Text>{user?.email ?? 'signed-out'}</Text>;
}

type ServiceMockOptions = {
  restoredSession?: Session | null;
  unsubscribe?: jest.Mock;
};

function createServiceMock(options: ServiceMockOptions = {}): AuthService {
  const unsubscribe = options.unsubscribe ?? jest.fn();

  return {
    getSession: jest.fn().mockResolvedValue(options.restoredSession ?? null),
    observeAuthState: jest.fn((_callback: AuthStateChangeCallback) => ({
      unsubscribe,
    })),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  };
}

function createSessionMock(email: string): Session {
  return {
    user: {
      email,
    },
  } as unknown as Session;
}
