import { Redirect, Stack } from 'expo-router';

import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function AuthRoutesLayout() {
  const { isInitializing, session } = useAuth();

  if (isInitializing) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
