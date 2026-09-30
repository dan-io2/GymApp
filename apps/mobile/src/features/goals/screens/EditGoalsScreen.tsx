import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  formatGoalLabel,
  formatWeeklyRate,
  formatWeight,
} from '@/features/dashboard/utils/dashboardFormatting';

import { useGoalEditing } from '../hooks/useGoalEditing';

export function EditGoalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const goalEditing = useGoalEditing({
    userId: user?.id,
    onSaved: () => {
      router.replace('/');
    },
  });

  if (goalEditing.isLoading) {
    return <AuthLoadingScreen />;
  }

  const data = goalEditing.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityLabel="Back to dashboard"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View>
            <Text style={styles.kicker}>Nutrition Goals</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Edit your targets
            </Text>
            <Text style={styles.description}>
              Customize calories and macros without repeating onboarding.
            </Text>
          </View>

          {goalEditing.status === 'error' ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Unable to load targets</Text>
              <Text style={styles.stateDescription}>
                {goalEditing.errorMessage ?? 'Please try again.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={goalEditing.refetch}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {data ? (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Goal</Text>
                <Text style={styles.summaryValue}>{formatGoalLabel(data.activeGoal.goalType)}</Text>
                <View style={styles.summaryGrid}>
                  {data.activeGoal.targetWeightKg ? (
                    <SummaryItem
                      label="Target Weight"
                      value={formatWeight(
                        data.activeGoal.targetWeightKg,
                        data.profile.preferredUnitSystem,
                      )}
                    />
                  ) : null}
                  {formatWeeklyRate(
                    data.activeGoal.weeklyRateKg,
                    data.activeGoal.goalType,
                    data.profile.preferredUnitSystem,
                  ) ? (
                    <SummaryItem
                      label="Weekly Rate"
                      value={
                        formatWeeklyRate(
                          data.activeGoal.weeklyRateKg,
                          data.activeGoal.goalType,
                          data.profile.preferredUnitSystem,
                        ) ?? ''
                      }
                    />
                  ) : null}
                </View>
              </View>

              <View style={styles.formCard}>
                <TargetInput
                  label="Daily Calories"
                  onChangeText={(value) => goalEditing.updateField('dailyCalories', value)}
                  suffix="kcal"
                  value={goalEditing.form.dailyCalories}
                />
                <TargetInput
                  label="Protein"
                  onChangeText={(value) => goalEditing.updateField('proteinG', value)}
                  suffix="g"
                  value={goalEditing.form.proteinG}
                />
                <TargetInput
                  label="Carbs"
                  onChangeText={(value) => goalEditing.updateField('carbsG', value)}
                  suffix="g"
                  value={goalEditing.form.carbsG}
                />
                <TargetInput
                  label="Fat"
                  onChangeText={(value) => goalEditing.updateField('fatG', value)}
                  suffix="g"
                  value={goalEditing.form.fatG}
                />
              </View>

              <View style={styles.calorieCard}>
                <Text style={styles.calorieLabel}>Daily target</Text>
                <Text style={styles.calorieValue}>
                  {goalEditing.form.dailyCalories || '-'} kcal
                </Text>
                <Text style={styles.calorieLabel}>Macros provide</Text>
                <Text style={styles.calorieValue}>
                  {goalEditing.macroCalories === null
                    ? '-'
                    : `${goalEditing.macroCalories.toLocaleString('en-US')} kcal`}
                </Text>
                <Text style={styles.calorieLabel}>Difference</Text>
                <Text style={styles.calorieValue}>
                  {goalEditing.macroDifference === null
                    ? '-'
                    : `${goalEditing.macroDifference.toLocaleString('en-US')} kcal`}
                </Text>
              </View>

              {goalEditing.errors.length > 0 ? (
                <AuthMessage message={goalEditing.errors.join('\n')} tone="error" />
              ) : null}

              {goalEditing.warnings.length > 0 ? (
                <View style={styles.warningMessage}>
                  <Text style={styles.warningText}>{goalEditing.warnings.join('\n')}</Text>
                </View>
              ) : null}

              {goalEditing.saveErrorMessage ? (
                <AuthMessage message={goalEditing.saveErrorMessage} tone="error" />
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={goalEditing.isSaving}
                  onPress={goalEditing.resetToRecommended}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && !goalEditing.isSaving && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Reset to Recommended</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    busy: goalEditing.isSaving,
                    disabled: goalEditing.isSaving,
                  }}
                  disabled={goalEditing.isSaving}
                  onPress={goalEditing.save}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    goalEditing.isSaving && styles.disabled,
                    pressed && !goalEditing.isSaving && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {goalEditing.isSaving ? 'Saving' : 'Save Goals'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TargetInput({
  label,
  onChangeText,
  suffix,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  suffix: string;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          onChangeText={onChangeText}
          selectionColor={colors.accent}
          style={styles.input}
          value={value}
        />
        <Text style={styles.inputSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemLabel}>{label}</Text>
      <Text style={styles.summaryItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  backText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  kicker: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  summaryLabel: {
    ...typography.micro,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  summaryValue: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  summaryItem: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    minWidth: '47%',
    padding: spacing.sm,
  },
  summaryItemLabel: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  summaryItemValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.sm,
  },
  input: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: 12,
  },
  inputSuffix: {
    ...typography.caption,
    color: colors.textMuted,
  },
  calorieCard: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md,
  },
  calorieLabel: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  calorieValue: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  warningMessage: {
    backgroundColor: colors.warningMuted,
    borderColor: colors.warning,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
  },
  warningText: {
    ...typography.secondary,
    color: colors.warning,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  stateTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  stateDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
});
