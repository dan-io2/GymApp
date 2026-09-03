import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

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
    <SafeAreaView style={styles.safeArea}>
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
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/goals/edit')}
              style={({ pressed }) => [styles.editGoalsButton, pressed && styles.pressed]}
            >
              <Text style={styles.editGoalsText}>Edit Goals</Text>
            </Pressable>

            <CalorieTargetCard progress={dailyProgress.calories} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Macros</Text>
              <View style={styles.macroGrid}>
                <MacroTargetCard label="Protein" progress={dailyProgress.protein} />
                <MacroTargetCard label="Carbs" progress={dailyProgress.carbs} />
                <MacroTargetCard label="Fat" progress={dailyProgress.fat} />
              </View>
            </View>

            <GoalSummaryCard goal={activeGoal} profile={data.profile} />

            <QuickActions
              onDiary={() => router.push('/diary')}
              onFindFood={() => router.push('/find-food')}
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
    backgroundColor: '#f7f8f3',
  },
  content: {
    flexGrow: 1,
    gap: 24,
    padding: 20,
  },
  dashboard: {
    gap: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#17211b',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  editGoalsButton: {
    alignItems: 'center',
    backgroundColor: '#1f8a5b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  editGoalsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
  },
});
