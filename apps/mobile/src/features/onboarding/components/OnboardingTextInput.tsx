import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';

type OnboardingTextInputProps = {
  accessibilityHint?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  value: string;
};

export function OnboardingTextInput({
  accessibilityHint,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  suffix,
  value,
}: OnboardingTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityHint={accessibilityHint}
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          style={styles.input}
          value={value}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
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
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: controlHeights.large,
    paddingHorizontal: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    minHeight: controlHeights.regular,
  },
  suffix: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
