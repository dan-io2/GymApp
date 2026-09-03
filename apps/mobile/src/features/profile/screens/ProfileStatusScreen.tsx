import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <Text style={styles.details}>User id: {userId}</Text>
          {errorCode ? <Text style={styles.details}>Error code: {errorCode}</Text> : null}
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
    backgroundColor: '#f7f8f3',
  },
  container: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: '#b45309',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 12,
  },
  description: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 24,
  },
  details: {
    color: '#6b746d',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#17211b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c8d2c8',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.88,
  },
});
