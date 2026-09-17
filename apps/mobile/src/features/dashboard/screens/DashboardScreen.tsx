import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppButton, SectionHeader } from '@/design/components';
import { colors, spacing } from '@/design/theme';
import { useAuth } from '@/features/auth/context/AuthContext';

import { CalorieTargetCard } from '../components/CalorieTargetCard';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardLoading } from '../components/DashboardLoading';
import { DashboardState } from '../components/DashboardState';
import { GoalSummaryCard } from '../components/GoalSummaryCard';
import { MacroTargetCard } from '../components/MacroTargetCard';
import { QuickActions } from '../components/QuickActions';
import { useDashboardData } from '../hooks/useDashboardData';

export function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, errorMessage, isLoading, isRefreshing, refetch, status } = useDashboardData(
    user?.id,
  );

  const activeGoal = data?.activeGoal ?? null;
  const dailyProgress = data?.dailyProgress ?? null;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefreshing} />}
      >
        <DashboardHeader email={user?.email} onOpenSettings={() => router.push('/settings')} />

        {isLoading ? <DashboardLoading /> : null}

        {status === 'error' ? (
          <DashboardState
            actionLabel="Retry"
            message={errorMessage ?? 'Unable to load your dashboard. Please try again.'}
            onAction={refetch}
            title="Dashboard unavailable"
          />
        ) : null}

        {status === 'success' && data && !activeGoal ? (
          <DashboardState
            actionLabel="Retry"
            message="We couldn't find your nutrition targets. Pull to refresh or retry after confirming onboarding saved correctly."
            onAction={refetch}
            title="We couldn't find your nutrition targets."
          />
        ) : null}

        {status === 'success' && data && activeGoal && dailyProgress ? (
          <View style={styles.dashboard}>
            <View style={styles.sectionHeader}>
              <SectionHeader subtitle="Your daily targets and intake" title="Nutrition" />
              <AppButton
                icon="options-outline"
                label="Edit Goals"
                onPress={() => router.push('/goals/edit')}
                style={styles.editGoalsButton}
                tone="ghost"
              />
            </View>

            <CalorieTargetCard progress={dailyProgress.calories} />

            <View style={styles.section}>
              <SectionHeader title="Macros" />
              <View style={styles.macroGrid}>
                <MacroTargetCard label="Protein" progress={dailyProgress.protein} />
                <MacroTargetCard label="Carbs" progress={dailyProgress.carbs} />
                <MacroTargetCard label="Fat" progress={dailyProgress.fat} />
              </View>
            </View>

            <GoalSummaryCard goal={activeGoal} profile={data.profile} />

            <QuickActions
              onCustomFood={() => router.push('/manual-food')}
              onFindFood={() => router.push('/find-food')}
              onSavedMeals={() => router.push('/saved-meals')}
              onScanBarcode={() => router.push('/scan')}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  dashboard: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  editGoalsButton: {
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
});
