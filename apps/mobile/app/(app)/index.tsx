import { Redirect } from 'expo-router';

import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import {
  getAuthenticatedRouteDecision,
  getRouteTargetForDecision,
} from '@/features/profile/routing/onboardingRouteDecision';
import { ProfileStatusScreen } from '@/features/profile/screens/ProfileStatusScreen';

export default function AuthenticatedHomeRoute() {
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
  const routeTarget = getRouteTargetForDecision({
    currentArea: 'app',
    decision: routeDecision,
  });

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

  if (routeTarget) {
    return <Redirect href={routeTarget} />;
  }

  return <DashboardScreen />;
}
