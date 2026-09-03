import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import { getAuthenticatedRouteDecision } from '@/features/profile/routing/onboardingRouteDecision';
import { ProfileStatusScreen } from '@/features/profile/screens/ProfileStatusScreen';

export default function AppRoutesLayout() {
  const { isInitializing, session, user } = useAuth();
  const {
    profile,
    status: profileStatus,
    errorMessage: profileErrorMessage,
    errorCode: profileErrorCode,
    refetch,
  } = useUserProfile(user?.id);
  const routeDecision = getAuthenticatedRouteDecision({
    isAuthInitializing: isInitializing,
    session,
    profileStatus,
    profile,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && user?.id) {
        refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refetch, user?.id]);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.info('[GymApp route]', {
      decision: routeDecision,
      profileErrorCode,
      profileErrorMessage,
      profileFound: Boolean(profile),
      profileStatus,
      userId: user?.id ?? null,
      onboardingCompleted: profile?.onboardingCompleted ?? null,
    });
  }, [profile, profileErrorCode, profileErrorMessage, profileStatus, routeDecision, user?.id]);

  if (routeDecision === 'loading') {
    return <AuthLoadingScreen />;
  }

  if (routeDecision === 'profile-error' && user?.id) {
    return (
      <ProfileStatusScreen
        errorCode={profileErrorCode}
        errorMessage={profileErrorMessage}
        onRetry={refetch}
        status={profileStatus === 'missing' ? 'missing' : 'error'}
        userId={user.id}
      />
    );
  }

  if (routeDecision === 'sign-in') {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
