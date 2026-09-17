import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';

import { useAuth } from '../context/AuthContext';
import { mapAuthError } from '../services/authErrors';
import { AuthMessage } from '../components/AuthMessage';

export function AuthenticatedHomeScreen() {
  const { user, signOut } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setErrorMessage(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      setErrorMessage(mapAuthError(error).message);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Text style={styles.kicker}>Authenticated</Text>
          <Text accessibilityRole="header" style={styles.title}>
            GymApp
          </Text>
          <Text style={styles.description}>
            {user?.email
              ? `Signed in as ${user.email}. Your profile setup is marked complete.`
              : 'Your Supabase session is active and your profile setup is marked complete.'}
          </Text>
        </View>

        {errorMessage ? <AuthMessage message={errorMessage} tone="error" /> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            isSigningOut && styles.disabled,
            pressed && !isSigningOut && styles.pressed,
          ]}
        >
          <Text style={styles.signOutText}>{isSigningOut ? 'Signing out' : 'Sign out'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  kicker: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  signOutText: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.88,
  },
});
