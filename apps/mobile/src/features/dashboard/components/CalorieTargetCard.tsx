import { StyleSheet, Text, View } from 'react-native';

import type { MacroProgress } from '@/features/diary/types/foodTypes';

import {
  formatCalories,
  formatCaloriesWithUnit,
  formatProgressStatus,
  getClampedProgressRatio,
} from '../utils/dashboardFormatting';

type CalorieTargetCardProps = {
  progress: MacroProgress;
};

export function CalorieTargetCard({ progress }: CalorieTargetCardProps) {
  const clampedProgressRatio = getClampedProgressRatio(progress.progressRatio);
  const statusText = formatProgressStatus({
    overage: progress.overage,
    remaining: progress.remaining,
    unit: 'kcal',
  });

  return (
    <View
      accessibilityLabel={`Today's calories ${formatCalories(progress.consumed)} of ${formatCalories(progress.target)} kilocalories, ${statusText}`}
      style={[styles.card, progress.overage > 0 && styles.cardOverTarget]}
    >
      <Text style={styles.kicker}>Daily Calories</Text>
      <View style={styles.valueStack}>
        <Text accessibilityRole="header" style={styles.calories}>
          {formatCalories(progress.consumed)}
        </Text>
        <Text style={styles.unit}>of {formatCaloriesWithUnit(progress.target)}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            progress.overage > 0 && styles.barFillOverTarget,
            { width: `${clampedProgressRatio * 100}%` },
          ]}
          testID="calorie-progress-fill"
        />
      </View>
      <Text style={[styles.label, progress.overage > 0 && styles.labelOverTarget]}>
        {statusText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#17211b',
    borderRadius: 8,
    padding: 24,
  },
  cardOverTarget: {
    backgroundColor: '#1c2a22',
  },
  kicker: {
    color: '#a9d8bd',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  valueStack: {
    alignItems: 'flex-start',
    gap: 2,
    marginTop: 18,
  },
  calories: {
    color: '#ffffff',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 60,
  },
  unit: {
    color: '#dce8df',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  label: {
    color: '#dce8df',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  barTrack: {
    backgroundColor: '#2a3a31',
    borderRadius: 5,
    height: 10,
    marginTop: 18,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#a9d8bd',
    borderRadius: 5,
    height: 10,
  },
  barFillOverTarget: {
    backgroundColor: '#55c68d',
  },
  labelOverTarget: {
    color: '#c9f0d8',
  },
});
