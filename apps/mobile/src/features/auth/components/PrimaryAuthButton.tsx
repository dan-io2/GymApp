import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';

type PrimaryAuthButtonProps = {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  onPress: () => void;
};

export function PrimaryAuthButton({
  label,
  loadingLabel,
  isLoading,
  onPress,
}: PrimaryAuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isLoading && styles.disabled,
        pressed && !isLoading && styles.pressed,
      ]}
    >
      {isLoading ? <ActivityIndicator color={colors.accentText} /> : null}
      <Text style={styles.label}>{isLoading ? loadingLabel : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
});
