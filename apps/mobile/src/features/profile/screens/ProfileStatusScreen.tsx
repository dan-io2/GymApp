import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { mapAuthError } from '@/features/auth/services/authErrors';

type ProfileStatusScreenProps = {
  errorCode: string | null;
  errorMessage: string | null;
  onRetry: () => Promise<void>;
  status: 'missing' | 'error';
  userId: string;
};

export function ProfileStatusScreen({
  errorCode,
  errorMessage,
  onRetry,
  status,
  userId,
}: ProfileStatusScreenProps) {
  const { signOut } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleRetry() {
    if (isRetrying) {
      return;
    }

    setIsRetrying(true);

    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleSignOut() {
    setSignOutError(null);

    try {
      await signOut();
    } catch (error) {
      setSignOutError(mapAuthError(error).message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <Text style={styles.kicker}>Profile check</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Profile setup needs attention
          </Text>
          <Text style={styles.description}>
            {status === 'missing'
              ? 'Your account is signed in, but no matching profile row was found.'
              : (errorMessage ?? 'Your profile could not be loaded.')}
          </Text>
          {__DEV__ ? <Text style={styles.details}>User id: {userId}</Text> : null}
          {__DEV__ && errorCode ? (
            <Text style={styles.details}>Error code: {errorCode}</Text>
          ) : null}
        </View>

        {signOutError ? <AuthMessage message={signOutError} tone="error" /> : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isRetrying, disabled: isRetrying }}
            disabled={isRetrying}
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.primaryButton,
              isRetrying && styles.disabled,
              pressed && !isRetrying && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{isRetrying ? 'Checking' : 'Check again'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleSignOut}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </View>
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
    color: colors.warning,
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
  details: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.88,
  },
});
