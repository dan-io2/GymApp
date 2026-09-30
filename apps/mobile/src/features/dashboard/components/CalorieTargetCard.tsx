import { StyleSheet, Text, View } from 'react-native';

import { AppCard, ProgressBar, StatusPill } from '@/design/components';
import { accents, colors, spacing, typography } from '@/design/theme';
import type { MacroProgress } from '@/features/diary/types/foodTypes';

import {
  formatCalories,
  formatCaloriesWithUnit,
  formatProgressStatus,
  getClampedProgressRatio,
} from '../utils/dashboardFormatting';

type CalorieTargetCardProps = { progress: MacroProgress };

export function CalorieTargetCard({ progress }: CalorieTargetCardProps) {
  const overTarget = progress.overage > 0;
  const statusText = formatProgressStatus({
    overage: progress.overage,
    remaining: progress.remaining,
    unit: 'kcal',
  });

  return (
    <AppCard
      accessibilityLabel={`Today's calories ${formatCalories(progress.consumed)} of ${formatCalories(progress.target)} kilocalories, ${statusText}`}
      raised
      style={styles.card}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Calories</Text>
        <StatusPill
          icon={overTarget ? 'add-circle-outline' : 'sparkles-outline'}
          label={statusText}
          tone={overTarget ? 'warning' : 'success'}
        />
      </View>
      <View style={styles.metricRow}>
        <Text accessibilityRole="header" style={styles.calories}>
          {formatCalories(progress.consumed)}
        </Text>
        <Text style={styles.unit}>of {formatCaloriesWithUnit(progress.target)}</Text>
      </View>
      <ProgressBar
        overTarget={overTarget}
        progress={getClampedProgressRatio(progress.progressRatio)}
        testID="calorie-progress-fill"
      />
      <View style={styles.footer}>
        <Text style={styles.caption}>Consumed</Text>
        <Text style={styles.caption}>{overTarget ? 'Daily target reached' : 'Daily target'}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSubtle,
    borderTopColor: accents.nutrition.foreground,
    borderTopWidth: 2,
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  metricRow: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  calories: { ...typography.display, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  unit: { ...typography.bodyStrong, color: colors.textSecondary, marginBottom: 5 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { ...typography.micro, color: colors.textMuted },
});
