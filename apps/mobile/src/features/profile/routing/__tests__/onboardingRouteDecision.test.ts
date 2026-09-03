import type { Session } from '@supabase/supabase-js';

import {
  getAuthenticatedRouteDecision,
  getRouteTargetForDecision,
} from '../onboardingRouteDecision';

describe('getAuthenticatedRouteDecision', () => {
  it('returns loading while auth is initializing', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: true,
        session: null,
        profileStatus: 'idle',
        profile: null,
      }),
    ).toBe('loading');
  });

  it('returns sign-in when the user is unauthenticated', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: false,
        session: null,
        profileStatus: 'idle',
        profile: null,
      }),
    ).toBe('sign-in');
  });

  it('returns loading while the authenticated profile is loading', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: false,
        session: createSessionMock(),
        profileStatus: 'loading',
        profile: null,
      }),
    ).toBe('loading');
  });

  it('routes authenticated users with incomplete profiles to onboarding', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: false,
        session: createSessionMock(),
        profileStatus: 'success',
        profile: {
          id: 'user-id',
          onboardingCompleted: false,
          preferredUnitSystem: 'imperial',
        },
      }),
    ).toBe('onboarding');
  });

  it('routes authenticated users with completed profiles to home', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: false,
        session: createSessionMock(),
        profileStatus: 'success',
        profile: {
          id: 'user-id',
          onboardingCompleted: true,
          preferredUnitSystem: 'imperial',
        },
      }),
    ).toBe('home');
  });

  it('returns a safe profile error decision when the profile query fails', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: false,
        session: createSessionMock(),
        profileStatus: 'error',
        profile: null,
      }),
    ).toBe('profile-error');
  });

  it('returns a safe profile error decision when the profile is missing', () => {
    expect(
      getAuthenticatedRouteDecision({
        isAuthInitializing: false,
        session: createSessionMock(),
        profileStatus: 'missing',
        profile: null,
      }),
    ).toBe('profile-error');
  });
});

describe('getRouteTargetForDecision', () => {
  it('routes unauthenticated users to auth without looping on auth routes', () => {
    expect(getRouteTargetForDecision({ currentArea: 'app', decision: 'sign-in' })).toBe('/sign-in');
    expect(getRouteTargetForDecision({ currentArea: 'auth', decision: 'sign-in' })).toBeNull();
  });

  it('routes incomplete profiles to onboarding without looping on onboarding routes', () => {
    expect(getRouteTargetForDecision({ currentArea: 'app', decision: 'onboarding' })).toBe(
      '/onboarding',
    );
    expect(
      getRouteTargetForDecision({ currentArea: 'onboarding', decision: 'onboarding' }),
    ).toBeNull();
  });

  it('routes completed profiles home without looping on app routes', () => {
    expect(getRouteTargetForDecision({ currentArea: 'onboarding', decision: 'home' })).toBe('/');
    expect(getRouteTargetForDecision({ currentArea: 'app', decision: 'home' })).toBeNull();
  });
});

function createSessionMock(): Session {
  return {
    user: {
      id: 'user-id',
    },
  } as unknown as Session;
}
