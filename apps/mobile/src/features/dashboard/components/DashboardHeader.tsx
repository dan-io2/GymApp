import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/design/components';
import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';

type DashboardHeaderProps = { email?: string | null; onOpenSettings: () => void };

export function DashboardHeader({ email, onOpenSettings }: DashboardHeaderProps) {
  const name = email?.split('@')[0];
  const date = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <Text style={styles.date}>{date}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Today
        </Text>
        <Text style={styles.greeting}>
          {name ? `Good to see you, ${name}` : 'Your daily nutrition at a glance'}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Open account settings"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onOpenSettings}
        style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
      >
        <AppIcon color={colors.textPrimary} name="person-outline" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  identity: { flex: 1, paddingRight: spacing.md },
  date: { ...typography.caption, color: colors.accent },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.xxs },
  greeting: { ...typography.secondary, color: colors.textSecondary, marginTop: spacing.xxs },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    height: controlHeights.compact,
    justifyContent: 'center',
    width: controlHeights.compact,
  },
  pressed: { opacity: 0.7 },
});
