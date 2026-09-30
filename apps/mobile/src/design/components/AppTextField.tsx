import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, controlHeights, radii, spacing, typography } from '../theme';

type AppTextFieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function AppTextField({ error, label, style, ...props }: AppTextFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary },
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
  inputError: { borderColor: colors.danger },
  error: { ...typography.secondary, color: colors.danger },
});
