import { StyleSheet, View } from 'react-native';

import { colors, radii } from '../theme';

type ProgressBarProps = {
  color?: string;
  overTarget?: boolean;
  progress: number;
  testID?: string;
};

export function ProgressBar({ color, overTarget = false, progress, testID }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%` as `${number}%`;

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          color ? { backgroundColor: color } : null,
          overTarget && styles.overTarget,
          { width },
        ]}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceInteractive,
    borderRadius: radii.capsule,
    height: 7,
    overflow: 'hidden',
  },
  fill: { backgroundColor: colors.accent, borderRadius: radii.capsule, height: 7 },
  overTarget: { backgroundColor: colors.warning },
});
