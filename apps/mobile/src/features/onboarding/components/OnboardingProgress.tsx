import { StyleSheet, Text, View } from 'react-native';

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
    gap: 8,
  },
  label: {
    color: '#526057',
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    backgroundColor: '#dfe7df',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#1f8a5b',
    height: '100%',
  },
});
