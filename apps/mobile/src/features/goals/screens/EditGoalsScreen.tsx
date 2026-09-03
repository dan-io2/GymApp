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
    backgroundColor: '#f7f8f3',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  backText: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '900',
  },
  kicker: {
    color: '#1f8a5b',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
    marginTop: 8,
  },
  description: {
    color: '#526057',
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  summaryLabel: {
    color: '#1f8a5b',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#17211b',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  summaryItem: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    minWidth: '47%',
    padding: 12,
  },
  summaryItemLabel: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryItemValue: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#24332b',
    fontSize: 15,
    fontWeight: '900',
  },
  inputShell: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 14,
  },
  input: {
    color: '#17211b',
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 12,
  },
  inputSuffix: {
    color: '#617067',
    fontSize: 15,
    fontWeight: '800',
  },
  calorieCard: {
    backgroundColor: '#17211b',
    borderRadius: 8,
    gap: 6,
    padding: 18,
  },
  calorieLabel: {
    color: '#a9d8bd',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calorieValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  warningMessage: {
    backgroundColor: '#fff8e6',
    borderColor: '#efd58a',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  warningText: {
    color: '#72520b',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1f8a5b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#1f7a54',
    fontSize: 16,
    fontWeight: '900',
  },
  stateCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  stateTitle: {
    color: '#17211b',
    fontSize: 22,
    fontWeight: '900',
  },
  stateDescription: {
    color: '#526057',
    fontSize: 16,
    lineHeight: 24,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
});
