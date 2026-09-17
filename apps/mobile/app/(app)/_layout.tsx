import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import type { ColorValue } from 'react-native';

import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';
import { getAuthenticatedRouteDecision } from '@/features/profile/routing/onboardingRouteDecision';
import { ProfileStatusScreen } from '@/features/profile/screens/ProfileStatusScreen';
import { AppIcon, type AppIconName } from '@/design/components';
import { colors, radii, typography } from '@/design/theme';

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
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.micro, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.borderStrong,
          borderRadius: radii.card,
          borderTopWidth: 1,
          bottom: 8,
          height: 68,
          left: 16,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          right: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} name="today-outline" size={size} />
          ),
          title: 'Today',
        }}
      />
      <Tabs.Screen
        name="diary/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} name="book-outline" size={size} />
          ),
          title: 'Diary',
        }}
      />
      <Tabs.Screen
        name="progress/index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} name="stats-chart-outline" size={size} />
          ),
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} name="grid-outline" size={size} />
          ),
          title: 'More',
        }}
      />
      <Tabs.Screen
        name="find-food/index"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen name="goals/edit" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen
        name="manual-food/index"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen
        name="reminders/index"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="saved-meals/index"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen name="scan/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}

function TabIcon({ color, name, size }: { color: ColorValue; name: AppIconName; size: number }) {
  return <AppIcon color={color} name={name} size={size} />;
}
