import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppButton,
  AppCard,
  AppIcon,
  EmptyState,
  SectionHeader,
  StatusPill,
} from '@/design/components';
import { accents, colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';

import { TrackingCalendar } from '../components/TrackingCalendar';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { YearActivity } from '../components/YearActivity';
import { useProgress } from '../hooks/useProgress';
import type { WeightTrendRange } from '../types/progressTypes';
import { createWeightTrend } from '../utils/progressCalculations';
import { formatWeight, formatWeightChange } from '../utils/progressFormatting';
import { toLocalDate } from '../utils/localDate';

const RANGES: WeightTrendRange[] = ['1m', '3m', '6m', '1y', 'all'];

export function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const progress = useProgress(user?.id);
  const [weight, setWeight] = useState('');
  const [range, setRange] = useState<WeightTrendRange>('3m');
  const data = progress.data;
  const trend = useMemo(
    () =>
      data ? createWeightTrend(data.checkIns, range, toLocalDate(new Date()), data.unitSystem) : [],
    [data, range],
  );

  async function save() {
    if (await progress.saveCheckIn(weight)) {
      setWeight('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={progress.status === 'loading'}
            onRefresh={progress.refetch}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Your consistency</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Progress
            </Text>
          </View>
          <StatusPill
            icon={data?.checkedInThisWeek ? 'checkmark-circle-outline' : 'time-outline'}
            label={data?.checkedInThisWeek ? 'Checked in' : 'Check-in due'}
            tone={data?.checkedInThisWeek ? 'success' : 'warning'}
          />
        </View>

        {progress.errorMessage ? (
          <AuthMessage message={progress.errorMessage} tone="error" />
        ) : null}

        {progress.status === 'loading' && !data ? (
          <AppCard style={styles.loadingCard}>
            <Text style={styles.muted}>Loading progress...</Text>
          </AppCard>
        ) : null}

        {data ? (
          <>
            <AppCard raised style={styles.weightHero}>
              <View style={styles.weightHeroTop}>
                <Text style={styles.eyebrow}>Weight</Text>
                <View style={styles.unitRow}>
                  {(['imperial', 'metric'] as const).map((unit) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: data.unitSystem === unit }}
                      key={unit}
                      onPress={() => void progress.changeUnitSystem(unit)}
                      style={[
                        styles.unitButton,
                        data.unitSystem === unit && styles.unitButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitText,
                          data.unitSystem === unit && styles.unitTextSelected,
                        ]}
                      >
                        {unit === 'imperial' ? 'lb' : 'kg'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              {data.latestCheckIn ? (
                <>
                  <Text style={styles.heroValue}>
                    {formatWeight(data.latestCheckIn, data.unitSystem)}
                  </Text>
                  <Text style={styles.heroMeta}>
                    Checked in {formatDate(data.latestCheckIn.localDate)}
                  </Text>
                </>
              ) : (
                <Text style={styles.heroEmpty}>No check-in yet</Text>
              )}
              {data.changeKg !== null ? (
                <Text style={styles.heroMeta}>
                  Change from previous: {formatWeightChange(data.changeKg, data.unitSystem)}
                </Text>
              ) : null}

              <View style={styles.checkInRow}>
                <TextInput
                  accessibilityLabel={`Weight in ${data.unitSystem === 'imperial' ? 'pounds' : 'kilograms'}`}
                  keyboardType="decimal-pad"
                  onChangeText={setWeight}
                  placeholder="Current weight"
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.accent}
                  style={styles.input}
                  value={weight}
                />
                <AppButton
                  accessibilityLabel="Save Check-In"
                  icon="checkmark"
                  label={progress.isSaving ? 'Saving' : 'Save'}
                  loading={progress.isSaving}
                  onPress={() => void save()}
                  style={styles.saveButton}
                />
              </View>
              <Text style={styles.helper}>
                Saving again today updates today&apos;s official check-in.
              </Text>
            </AppCard>

            <AppCard style={styles.sectionCard}>
              <SectionHeader subtitle="Recorded check-ins only" title="Weight trend" />
              <View style={styles.rangeRow}>
                {RANGES.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: range === item }}
                    key={item}
                    onPress={() => setRange(item)}
                    style={[styles.rangeButton, range === item && styles.rangeSelected]}
                  >
                    <Text style={[styles.rangeText, range === item && styles.rangeTextSelected]}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WeightTrendChart points={trend} />
            </AppCard>

            <View style={styles.metrics}>
              <Metric
                color={accents.nutrition.foreground}
                icon="flame-outline"
                label="Current"
                muted={accents.nutrition.muted}
                value={`${data.consistency.currentStreak} days`}
              />
              <Metric
                color={accents.analytics.foreground}
                icon="trophy-outline"
                label="Longest"
                muted={accents.analytics.muted}
                value={`${data.consistency.longestStreak} days`}
              />
              <Metric
                color={accents.weight.foreground}
                icon="calendar-outline"
                label="This month"
                muted={accents.weight.muted}
                value={`${data.consistency.monthlyConsistencyPercentage}%`}
              />
              <Metric
                color={accents.carbohydrate.foreground}
                icon="checkmark-done-outline"
                label="Total tracked"
                muted={accents.carbohydrate.muted}
                value={`${data.consistency.totalTrackedDays}`}
              />
            </View>

            <AppCard style={styles.sectionCard}>
              <SectionHeader
                subtitle={`${data.consistency.monthlyTrackedDays} of ${data.consistency.monthlyEligibleDays} eligible days`}
                title={monthTitle(data.recap.month)}
              />
              <TrackingCalendar days={data.calendarMonth} />
            </AppCard>

            <AppCard style={styles.sectionCard}>
              <SectionHeader subtitle="A compact view of your year" title="Annual consistency" />
              <YearActivity days={data.calendarYear} />
            </AppCard>

            <AppCard style={styles.sectionCard}>
              <SectionHeader subtitle="Your month in numbers" title="Monthly recap" />
              <View style={styles.recapGrid}>
                <RecapMetric
                  color={accents.nutrition.foreground}
                  label="Foods logged"
                  value={`${data.recap.totalFoodsLogged}`}
                />
                <RecapMetric
                  color={colors.warning}
                  label="Avg calories"
                  value={
                    data.recap.averageCalories === null
                      ? 'Unavailable'
                      : `${data.recap.averageCalories}`
                  }
                />
                <RecapMetric
                  color={accents.carbohydrate.foreground}
                  label="Avg protein"
                  value={
                    data.recap.averageProteinG === null
                      ? 'Unavailable'
                      : `${data.recap.averageProteinG} g`
                  }
                />
                <RecapMetric
                  color={accents.analytics.foreground}
                  label="Consistency"
                  value={`${data.recap.consistencyPercentage}%`}
                />
              </View>
            </AppCard>

            <View style={styles.historySection}>
              <SectionHeader title="Recent check-ins" />
              {data.checkIns.length === 0 ? (
                <EmptyState
                  icon="scale-outline"
                  message="Your saved weights will appear here."
                  title="No check-ins yet"
                />
              ) : (
                <AppCard style={styles.historyCard}>
                  {[...data.checkIns]
                    .reverse()
                    .slice(0, 6)
                    .map((checkIn, index) => (
                      <View
                        key={checkIn.id}
                        style={[styles.historyRow, index > 0 && styles.historyDivider]}
                      >
                        <View>
                          <Text style={styles.historyDate}>{formatDate(checkIn.localDate)}</Text>
                          <Text style={styles.historyRaw}>{checkIn.localDate}</Text>
                        </View>
                        <Text style={styles.historyValue}>
                          {formatWeight(checkIn, data.unitSystem)}
                        </Text>
                      </View>
                    ))}
                </AppCard>
              )}
            </View>

            <AppButton
              icon="notifications-outline"
              label="Manage Reminders"
              onPress={() => router.push('/reminders')}
              tone="secondary"
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  color,
  icon,
  label,
  muted,
  value,
}: {
  color: string;
  icon: 'flame-outline' | 'trophy-outline' | 'calendar-outline' | 'checkmark-done-outline';
  label: string;
  muted: string;
  value: string;
}) {
  return (
    <AppCard style={[styles.metric, { borderTopColor: color }]}>
      <View style={[styles.metricIcon, { backgroundColor: muted }]}>
        <AppIcon color={color} name={icon} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

function RecapMetric({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.recapMetric}>
      <View style={[styles.recapIndicator, { backgroundColor: color }]} />
      <Text style={[styles.recapValue, { color }]}>{value}</Text>
      <Text style={styles.recapLabel}>{label}</Text>
    </View>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(`${month}-01T12:00:00`),
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: {
    gap: spacing.md,
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { ...typography.caption, color: colors.accent, textTransform: 'uppercase' },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.xxs },
  loadingCard: { minHeight: 160, justifyContent: 'center' },
  muted: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  weightHero: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSubtle,
    borderTopColor: accents.weight.foreground,
    borderTopWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  weightHeroTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  heroValue: {
    ...typography.display,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.sm,
  },
  heroEmpty: { ...typography.metric, color: colors.textMuted, marginTop: spacing.md },
  heroMeta: { ...typography.secondary, color: colors.textSecondary },
  unitRow: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    flexDirection: 'row',
    padding: 3,
  },
  unitButton: {
    alignItems: 'center',
    borderRadius: radii.small,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 48,
  },
  unitButtonSelected: { backgroundColor: accents.weight.muted },
  unitText: { ...typography.caption, color: colors.textMuted },
  unitTextSelected: { color: accents.weight.foreground },
  checkInRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  input: {
    ...typography.bodyStrong,
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.sm,
  },
  saveButton: { minWidth: 104 },
  helper: { ...typography.micro, color: colors.textMuted },
  sectionCard: { gap: spacing.sm },
  rangeRow: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    flexDirection: 'row',
    padding: 3,
  },
  rangeButton: {
    alignItems: 'center',
    borderRadius: radii.small,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  rangeSelected: { backgroundColor: accents.weight.muted },
  rangeText: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase' },
  rangeTextSelected: { color: accents.weight.foreground },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metric: {
    borderTopWidth: 2,
    flexBasis: '48%',
    gap: spacing.xs,
    minHeight: 100,
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  metricValue: { ...typography.metric, fontVariant: ['tabular-nums'] },
  metricLabel: { ...typography.caption, color: colors.textMuted },
  recapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  recapMetric: {
    backgroundColor: colors.surfaceInteractive,
    borderRadius: radii.medium,
    flexBasis: '48%',
    gap: spacing.xxs,
    padding: spacing.sm,
  },
  recapIndicator: { borderRadius: radii.capsule, height: 3, width: 24 },
  recapValue: { ...typography.cardTitle, color: colors.textPrimary },
  recapLabel: { ...typography.micro, color: colors.textMuted },
  historySection: { gap: spacing.sm },
  historyCard: { paddingVertical: 0 },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  historyDivider: { borderColor: colors.borderSubtle, borderTopWidth: StyleSheet.hairlineWidth },
  historyDate: { ...typography.bodyStrong, color: colors.textPrimary },
  historyRaw: { ...typography.micro, color: colors.textMuted },
  historyValue: { ...typography.cardTitle, color: colors.textPrimary },
});
