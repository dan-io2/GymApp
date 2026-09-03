import { StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Current Goal</Text>
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
    </View>
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
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: {
    color: '#1f8a5b',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  goal: {
    color: '#17211b',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
    marginTop: 10,
  },
  context: {
    color: '#617067',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    marginTop: 6,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  detail: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    minWidth: '47%',
    padding: 12,
  },
  detailLabel: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
});
