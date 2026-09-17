import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';
import { AppIcon, type AppIconName } from './AppIcon';

type StatusPillProps = {
  icon?: AppIconName;
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'information';
};

export function StatusPill({ icon, label, tone = 'neutral' }: StatusPillProps) {
  const palette = palettes[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      {icon ? <AppIcon color={palette.foreground} name={icon} size={14} /> : null}
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

const palettes = {
  neutral: { background: colors.surfaceInteractive, foreground: colors.textSecondary },
  success: { background: colors.successMuted, foreground: colors.success },
  warning: { background: colors.warningMuted, foreground: colors.warning },
  danger: { background: colors.dangerMuted, foreground: colors.danger },
  information: { background: colors.informationMuted, foreground: colors.information },
};

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.capsule,
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  label: typography.micro,
});
