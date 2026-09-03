import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerPrompt: string;
  footerActionLabel: string;
  onFooterAction: () => void;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  footerPrompt,
  footerActionLabel,
  onFooterAction,
}: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.kicker}>GymApp</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {children}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{footerPrompt}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onFooterAction}
              style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
            >
              <Text style={styles.footerButtonText}>{footerActionLabel}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f8f3',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
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
  subtitle: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  footerText: {
    color: '#526057',
    fontSize: 15,
  },
  footerButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  footerButtonText: {
    color: '#1f7a54',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
