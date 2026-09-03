import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { mapAuthError } from '@/features/auth/services/authErrors';

export function SettingsScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
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
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          accessibilityLabel="Back to dashboard"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View>
          <Text style={styles.kicker}>Account</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Settings
          </Text>
          <Text style={styles.description}>
            {user?.email ? `Signed in as ${user.email}.` : 'You are signed in.'}
          </Text>
        </View>

        {errorMessage ? <AuthMessage message={errorMessage} tone="error" /> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isSigningOut, disabled: isSigningOut }}
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
    backgroundColor: '#f7f8f3',
  },
  container: {
    flex: 1,
    gap: 24,
    padding: 24,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  backText: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '900',
  },
  kicker: {
    color: '#1f8a5b',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
    marginTop: 8,
  },
  description: {
    color: '#526057',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#17211b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
});
