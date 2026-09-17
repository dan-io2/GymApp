import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, controlHeights, radii, spacing, typography } from '../theme';
import { AppIcon, type AppIconName } from './AppIcon';

type AppButtonProps = PressableProps & {
  icon?: AppIconName;
  label: string;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function AppButton({
  disabled,
  icon,
  label,
  loading = false,
  style,
  tone = 'primary',
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const foreground =
    tone === 'primary' ? colors.accentText : tone === 'danger' ? colors.danger : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[tone],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : icon ? (
        <AppIcon color={foreground} name={icon} />
      ) : null}
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.accent },
  secondary: {
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  ghost: { backgroundColor: colors.transparent },
  danger: { backgroundColor: colors.dangerMuted, borderColor: colors.danger, borderWidth: 1 },
  label: typography.bodyStrong,
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.48 },
});
