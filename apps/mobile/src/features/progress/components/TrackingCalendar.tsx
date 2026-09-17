import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/design/components';
import { accents, colors, spacing, typography } from '@/design/theme';

import type { CalendarDayState } from '../types/progressTypes';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function TrackingCalendar({ days }: { days: CalendarDayState[] }) {
  if (days.length === 0) {
    return <Text style={styles.empty}>Calendar activity will appear after progress loads.</Text>;
  }

  const firstWeekday = new Date(`${days[0].date}T12:00:00`).getDay();

  return (
    <View style={styles.calendar}>
      <View style={styles.week}>
        {WEEKDAYS.map((weekday, index) => (
          <Text key={`${weekday}-${index}`} style={styles.weekday}>
            {weekday}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: firstWeekday }, (_, index) => (
          <View key={`offset-${index}`} style={styles.day} />
        ))}
        {days.map((day) => (
          <View
            accessibilityLabel={`${formatDate(day.date)}, ${day.state}${day.tracked ? `, ${day.entryCount} foods logged` : ''}`}
            accessible
            key={day.date}
            style={[
              styles.day,
              day.state === 'tracked' && styles.tracked,
              day.state === 'future' && styles.future,
            ]}
          >
            <Text style={[styles.dayNumber, day.state === 'future' && styles.futureText]}>
              {Number(day.date.slice(-2))}
            </Text>
            {day.tracked ? (
              <AppIcon color={accents.analytics.foreground} name="checkmark" size={12} />
            ) : null}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Legend color={accents.analytics.muted} label="Tracked" symbol="checkmark" />
        <Legend color={colors.surfaceRaised} label="Untracked" />
        <Legend color={colors.backgroundElevated} label="Future" />
      </View>
    </View>
  );
}

function Legend({ color, label, symbol }: { color: string; label: string; symbol?: 'checkmark' }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]}>
        {symbol ? <AppIcon color={accents.analytics.foreground} name={symbol} size={10} /> : null}
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
}

const styles = StyleSheet.create({
  calendar: { gap: spacing.sm },
  week: { flexDirection: 'row' },
  weekday: { ...typography.micro, color: colors.textMuted, textAlign: 'center', width: '14.285%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xxs },
  day: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '14.285%',
  },
  tracked: {
    backgroundColor: accents.analytics.muted,
    borderColor: accents.analytics.foreground,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  future: { opacity: 0.35 },
  dayNumber: { ...typography.caption, color: colors.textSecondary },
  futureText: { color: colors.textMuted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs },
  legendSwatch: {
    alignItems: 'center',
    borderRadius: 3,
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  legendText: { ...typography.micro, color: colors.textMuted },
  empty: { ...typography.secondary, color: colors.textMuted },
});
