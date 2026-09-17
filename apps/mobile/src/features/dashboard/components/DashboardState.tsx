import { StyleSheet, Text } from 'react-native';

import { AppButton, AppCard } from '@/design/components';
import { colors, spacing, typography } from '@/design/theme';

type DashboardStateProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
};

export function DashboardState({ actionLabel, message, onAction, title }: DashboardStateProps) {
  return (
    <AppCard style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
