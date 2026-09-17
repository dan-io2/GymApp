import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/features/auth/context/AuthContext';
import { configureReminderNotifications } from '@/features/reminders/services/reminderService';

export default function RootLayout() {
  useEffect(() => {
    configureReminderNotifications();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
