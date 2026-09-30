import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';

type AuthTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AuthTextInput({ label, error, style, ...props }: AuthTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.textPrimary,
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.secondary,
    color: colors.danger,
  },
});
