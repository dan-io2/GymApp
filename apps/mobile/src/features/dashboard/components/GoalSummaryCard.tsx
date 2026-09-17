import { StyleSheet, Text, View } from 'react-native';

import { AppCard, StatusPill } from '@/design/components';
import { accents, colors, radii, spacing, typography } from '@/design/theme';
import type { ActiveNutritionGoal, DashboardProfile } from '../types/dashboardTypes';
import {
  formatActivityLabel,
  formatGoalLabel,
  formatWeeklyRate,
  formatWeight,
  getCalorieContext,
} from '../utils/dashboardFormatting';

type GoalSummaryCardProps = {
  goal: ActiveNutritionGoal;
  profile: DashboardProfile;
};

export function GoalSummaryCard({ goal, profile }: GoalSummaryCardProps) {
  const weeklyRate = formatWeeklyRate(
    goal.weeklyRateKg,
    goal.goalType,
    profile.preferredUnitSystem,
  );

  return (
    <AppCard style={styles.card}>
      <StatusPill icon="navigate-outline" label="Current goal" tone="information" />
      <Text style={styles.goal}>{formatGoalLabel(goal.goalType)}</Text>
      <Text style={styles.context}>{getCalorieContext(goal)}</Text>

      <View style={styles.detailGrid}>
        {profile.currentWeightKg ? (
          <Detail
            label="Current Weight"
            value={formatWeight(profile.currentWeightKg, profile.preferredUnitSystem)}
          />
        ) : null}
        {goal.targetWeightKg ? (
          <Detail
            label="Target"
            value={formatWeight(goal.targetWeightKg, profile.preferredUnitSystem)}
          />
        ) : null}
        {weeklyRate ? <Detail label="Rate" value={weeklyRate} /> : null}
        <Detail label="Activity" value={formatActivityLabel(goal.activityLevel)} />
      </View>
    </AppCard>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: accents.analytics.surface,
    borderColor: accents.analytics.muted,
    borderLeftColor: accents.analytics.foreground,
    borderLeftWidth: 2,
    padding: spacing.md,
  },
  goal: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  context: {
    ...typography.secondary,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  detail: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    minWidth: '47%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  detailValue: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
});
