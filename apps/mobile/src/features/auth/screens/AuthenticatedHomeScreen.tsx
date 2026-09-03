import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    backgroundColor: '#f7f8f3',
  },
  container: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: '#1f7a54',
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
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.88,
  },
});
