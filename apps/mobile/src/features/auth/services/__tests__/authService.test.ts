import { AuthApiError, type Session, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

import { createAuthService } from '../authService';

describe('createAuthService', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs in with validated credentials', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue({ error: null });
    const service = createAuthService(
      createClientMock({
        signInWithPassword,
      }),
    );

    await expect(
      service.signIn({
        email: 'person@example.com',
        password: 'password123',
      }),
    ).resolves.toBeUndefined();

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'password123',
    });
  });

  it('reports email confirmation when sign-up returns no session', async () => {
    const signUp = jest.fn().mockResolvedValue({ data: { session: null }, error: null });
    const service = createAuthService(
      createClientMock({
        signUp,
      }),
    );

    await expect(
      service.signUp({
        email: 'person@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).resolves.toEqual({ requiresEmailConfirmation: true });
  });

  it('maps duplicate sign-up errors from Supabase', async () => {
    const signUp = jest.fn().mockResolvedValue({
      data: { session: null },
      error: new AuthApiError('User already registered', 422, 'user_already_exists'),
    });
    const service = createAuthService(
      createClientMock({
        signUp,
      }),
    );

    await expect(
      service.signUp({
        email: 'person@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).rejects.toMatchObject({
      code: 'user_already_registered',
      message: 'An account with this email already exists. Try signing in instead.',
    });
  });

  it('returns the restored session from Supabase', async () => {
    const session = createSessionMock('person@example.com');
    const service = createAuthService(
      createClientMock({
        getSession: jest.fn().mockResolvedValue({ data: { session }, error: null }),
      }),
    );

    await expect(service.getSession()).resolves.toBe(session);
  });
});

type ClientMockOverrides = {
  getSession?: jest.Mock;
  onAuthStateChange?: jest.Mock;
  signInWithPassword?: jest.Mock;
  signUp?: jest.Mock;
  signOut?: jest.Mock;
};

function createClientMock(overrides: ClientMockOverrides): SupabaseClient<Database> {
  return {
    auth: {
      getSession: overrides.getSession ?? jest.fn(),
      onAuthStateChange:
        overrides.onAuthStateChange ??
        jest.fn(() => ({
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        })),
      signInWithPassword: overrides.signInWithPassword ?? jest.fn(),
      signUp: overrides.signUp ?? jest.fn(),
      signOut: overrides.signOut ?? jest.fn(),
    },
  } as unknown as SupabaseClient<Database>;
}

function createSessionMock(email: string): Session {
  return {
    user: {
      email,
    },
  } as unknown as Session;
}
