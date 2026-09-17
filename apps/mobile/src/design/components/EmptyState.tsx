import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { AppIcon, type AppIconName } from './AppIcon';

type EmptyStateProps = {
  actionLabel?: string;
  icon: AppIconName;
  message: string;
  onAction?: () => void;
  title: string;
};

export function EmptyState({ actionLabel, icon, message, onAction, title }: EmptyStateProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.icon}>
        <AppIcon color={colors.accent} name={icon} size={26} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  title: { ...typography.cardTitle, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.secondary, color: colors.textSecondary, textAlign: 'center' },
});
