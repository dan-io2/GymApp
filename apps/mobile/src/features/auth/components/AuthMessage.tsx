import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/theme';

type AuthMessageProps = {
  message: string;
  tone: 'error' | 'success';
};

export function AuthMessage({ message, tone }: AuthMessageProps) {
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      style={[styles.container, tone === 'error' ? styles.errorContainer : styles.successContainer]}
    >
      <Text style={[styles.text, tone === 'error' ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.medium,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorContainer: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
  },
  successContainer: {
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
  },
  text: {
    ...typography.secondary,
  },
  errorText: {
    color: colors.danger,
  },
  successText: {
    color: colors.success,
  },
});
