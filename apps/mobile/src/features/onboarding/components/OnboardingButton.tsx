import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';

type OnboardingButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function OnboardingButton({
  disabled = false,
  label,
  onPress,
  variant = 'primary',
}: OnboardingButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    ...typography.bodyStrong,
  },
  primaryLabel: {
    color: colors.accentText,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.58,
  },
  pressed: {
    opacity: 0.88,
  },
});
