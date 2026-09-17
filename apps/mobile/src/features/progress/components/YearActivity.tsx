import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { accents, colors, spacing, typography } from '@/design/theme';

import type { CalendarDayState } from '../types/progressTypes';

export function YearActivity({ days }: { days: CalendarDayState[] }) {
  const tracked = days.filter((day) => day.tracked).length;

  return (
    <View
      accessibilityLabel={`${tracked} tracked days in this year`}
      accessible
      style={styles.container}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {days.map((day) => (
            <View
              key={day.date}
              style={[
                styles.cell,
                day.state === 'tracked' && styles.tracked,
                day.state === 'future' && styles.future,
              ]}
            />
          ))}
        </View>
      </ScrollView>
      <Text style={styles.caption}>{tracked} tracked days this year</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  grid: { flexDirection: 'column', flexWrap: 'wrap', gap: 3, height: 60 },
  cell: { backgroundColor: colors.surfaceInteractive, borderRadius: 2, height: 6, width: 6 },
  tracked: { backgroundColor: accents.analytics.foreground },
  future: { backgroundColor: colors.backgroundElevated },
  caption: { ...typography.micro, color: colors.textMuted },
});
