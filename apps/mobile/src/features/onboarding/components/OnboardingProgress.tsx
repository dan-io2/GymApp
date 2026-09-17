import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/theme';

type OnboardingProgressProps = {
  currentStepIndex: number;
  totalSteps: number;
};

export function OnboardingProgress({ currentStepIndex, totalSteps }: OnboardingProgressProps) {
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <Text style={styles.label}>
        Step {currentStepIndex + 1} of {totalSteps}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  track: {
    backgroundColor: colors.surfaceInteractive,
    borderRadius: radii.capsule,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.accent,
    height: '100%',
  },
});
