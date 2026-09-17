import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/design/theme';

export function DashboardLoading() {
  return (
    <View accessibilityLabel="Loading nutrition dashboard" style={styles.container}>
      <Text style={styles.kicker}>Loading</Text>
      <View style={styles.heroBlock} />
      <View style={styles.row}>
        <View style={styles.smallBlock} />
        <View style={styles.smallBlock} />
        <View style={styles.smallBlock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  kicker: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  heroBlock: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 168,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  smallBlock: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    flex: 1,
    height: 114,
  },
});
