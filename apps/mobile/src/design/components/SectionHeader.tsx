import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type SectionHeaderProps = {
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
  title: string;
};

export function SectionHeader({ actionLabel, onAction, subtitle, title }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  copy: { flex: 1 },
  title: { ...typography.sectionTitle, color: colors.textPrimary },
  subtitle: { ...typography.secondary, color: colors.textMuted, marginTop: spacing.xxs },
  action: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.xs },
  actionText: { ...typography.caption, color: colors.accent },
});
