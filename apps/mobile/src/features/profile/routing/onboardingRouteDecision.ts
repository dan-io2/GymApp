import type { Session } from '@supabase/supabase-js';

import type { UserProfile } from '../services/profileService';

export type AuthenticatedRouteDecision =
  'loading' | 'sign-in' | 'profile-error' | 'onboarding' | 'home';
export type ProfileRouteStatus = 'idle' | 'loading' | 'success' | 'missing' | 'error';
export type ProtectedRouteArea = 'auth' | 'onboarding' | 'app' | 'unknown';

export type RouteTarget = '/sign-in' | '/onboarding' | '/';

type GetAuthenticatedRouteDecisionInput = {
  isAuthInitializing: boolean;
  session: Session | null;
  profileStatus: ProfileRouteStatus;
  profile: UserProfile | null;
};

export function getAuthenticatedRouteDecision({
  isAuthInitializing,
  session,
  profileStatus,
  profile,
}: GetAuthenticatedRouteDecisionInput): AuthenticatedRouteDecision {
  if (isAuthInitializing) {
    return 'loading';
  }

  if (!session) {
    return 'sign-in';
  }

  if (profileStatus === 'idle' || profileStatus === 'loading') {
    return 'loading';
  }

  if (profileStatus === 'error' || profileStatus === 'missing') {
    return 'profile-error';
  }

  if (!profile?.onboardingCompleted) {
    return 'onboarding';
  }

  return 'home';
}

export function getRouteTargetForDecision({
  currentArea,
  decision,
}: {
  currentArea: ProtectedRouteArea;
  decision: AuthenticatedRouteDecision;
}): RouteTarget | null {
  if (decision === 'loading') {
    return null;
  }

  if (decision === 'sign-in') {
    return currentArea === 'auth' ? null : '/sign-in';
  }

  if (decision === 'profile-error') {
    return null;
  }

  if (decision === 'onboarding') {
    return currentArea === 'onboarding' ? null : '/onboarding';
  }

  return currentArea === 'app' ? null : '/';
}
