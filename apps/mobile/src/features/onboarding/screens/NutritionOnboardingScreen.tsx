import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/design/theme';
import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUserProfile } from '@/features/profile/hooks/useUserProfile';

import { ChoiceCard } from '../components/ChoiceCard';
import { OnboardingButton } from '../components/OnboardingButton';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { OnboardingTextInput } from '../components/OnboardingTextInput';
import { UnitSystemToggle } from '../components/UnitSystemToggle';
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  ONBOARDING_STEPS,
  SEX_OPTIONS,
} from '../constants/onboardingOptions';
import { useNutritionOnboarding } from '../hooks/useNutritionOnboarding';

export function NutritionOnboardingScreen() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading, refetch } = useUserProfile(user?.id);

  const onboarding = useNutritionOnboarding({
    userId: user?.id ?? '',
    profile,
    onCompleted: async () => {
      await refetch();
    },
  });
  const { state } = onboarding;

  if (!user?.id || isProfileLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingProgress
            currentStepIndex={state.currentStepIndex}
            totalSteps={ONBOARDING_STEPS.length}
          />

          <View style={styles.content}>{renderStep(onboarding)}</View>

          {state.errors.length > 0 ? (
            <AuthMessage message={state.errors.join('\n')} tone="error" />
          ) : null}

          {state.saveErrorMessage ? (
            <AuthMessage message={state.saveErrorMessage} tone="error" />
          ) : null}

          <View style={styles.actions}>
            {!state.isFirstStep ? (
              <OnboardingButton
                disabled={state.isSaving}
                label="Back"
                onPress={onboarding.goBack}
                variant="secondary"
              />
            ) : null}
            <OnboardingButton
              disabled={state.isSaving}
              label={
                state.isLastStep ? (state.isSaving ? 'Saving' : 'Save and continue') : 'Continue'
              }
              onPress={state.isLastStep ? onboarding.save : onboarding.goNext}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function renderStep(onboarding: ReturnType<typeof useNutritionOnboarding>) {
  const { form, review, currentStep } = onboarding.state;

  switch (currentStep) {
    case 'welcome':
      return (
        <StepShell
          kicker="Nutrition setup"
          title="Let's personalize your nutrition goals."
          description="GymApp will estimate your maintenance calories, daily calorie goal, protein, carbs, and fats."
        />
      );
    case 'units':
      return (
        <StepShell
          kicker="Units"
          title="Choose your preferred units"
          description="Your inputs can use pounds and feet or kilograms and centimeters. GymApp stores normalized metric values."
        >
          <UnitSystemToggle onChange={onboarding.setUnitSystem} value={form.unitSystem} />
        </StepShell>
      );
    case 'dateOfBirth':
      return (
        <StepShell
          kicker="Age"
          title="When were you born?"
          description="Using a birth date keeps the calculation current without asking for age again later."
        >
          <OnboardingTextInput
            accessibilityHint="Enter date as four digit year, two digit month, and two digit day"
            keyboardType="numbers-and-punctuation"
            label="Date of birth"
            onChangeText={(value) => onboarding.setField('dateOfBirth', value)}
            placeholder="YYYY-MM-DD"
            value={form.dateOfBirth}
          />
        </StepShell>
      );
    case 'sex':
      return (
        <StepShell
          kicker="Formula input"
          title="Select the sex value for calorie estimation"
          description="This is used only by the BMR formula and does not define your identity."
        >
          {SEX_OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              isSelected={form.sexForCalculation === option.value}
              onSelect={(value) => onboarding.setSelection('sexForCalculation', value)}
              title={option.title}
              value={option.value}
            />
          ))}
        </StepShell>
      );
    case 'height':
      return (
        <StepShell kicker="Height" title="How tall are you?">
          {form.unitSystem === 'metric' ? (
            <OnboardingTextInput
              keyboardType="decimal-pad"
              label="Height"
              onChangeText={(value) => onboarding.setField('heightCm', value)}
              placeholder="183"
              suffix="cm"
              value={form.heightCm}
            />
          ) : (
            <View style={styles.inlineInputs}>
              <View style={styles.inlineInput}>
                <OnboardingTextInput
                  keyboardType="number-pad"
                  label="Feet"
                  onChangeText={(value) => onboarding.setField('heightFeet', value)}
                  placeholder="6"
                  suffix="ft"
                  value={form.heightFeet}
                />
              </View>
              <View style={styles.inlineInput}>
                <OnboardingTextInput
                  keyboardType="decimal-pad"
                  label="Inches"
                  onChangeText={(value) => onboarding.setField('heightInches', value)}
                  placeholder="0"
                  suffix="in"
                  value={form.heightInches}
                />
              </View>
            </View>
          )}
        </StepShell>
      );
    case 'weight':
      return (
        <StepShell kicker="Current weight" title="What do you weigh right now?">
          <OnboardingTextInput
            keyboardType="decimal-pad"
            label="Current weight"
            onChangeText={(value) =>
              onboarding.setField(form.unitSystem === 'metric' ? 'weightKg' : 'weightLb', value)
            }
            placeholder={form.unitSystem === 'metric' ? '82' : '180'}
            suffix={form.unitSystem === 'metric' ? 'kg' : 'lb'}
            value={form.unitSystem === 'metric' ? form.weightKg : form.weightLb}
          />
        </StepShell>
      );
    case 'activity':
      return (
        <StepShell kicker="Activity" title="How active are you?">
          {ACTIVITY_OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              description={option.description}
              isSelected={form.activityLevel === option.value}
              onSelect={(value) => onboarding.setSelection('activityLevel', value)}
              title={option.title}
              value={option.value}
            />
          ))}
        </StepShell>
      );
    case 'goal':
      return (
        <StepShell kicker="Goal" title="What are you working toward?">
          {GOAL_OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              description={option.description}
              isSelected={form.goalType === option.value}
              onSelect={(value) => onboarding.setSelection('goalType', value)}
              title={option.title}
              value={option.value}
            />
          ))}
        </StepShell>
      );
    case 'target':
      return (
        <StepShell
          kicker="Target"
          title={
            form.goalType === 'maintain' ? 'Maintenance is set' : 'Add optional target details'
          }
          description={
            form.goalType === 'maintain'
              ? 'GymApp will use your estimated maintenance calories.'
              : 'Leave these blank to use the conservative defaults from the nutrition package.'
          }
        >
          {form.goalType === 'maintain' ? null : (
            <>
              <OnboardingTextInput
                keyboardType="decimal-pad"
                label="Target weight"
                onChangeText={(value) =>
                  onboarding.setField(
                    form.unitSystem === 'metric' ? 'targetWeightKg' : 'targetWeightLb',
                    value,
                  )
                }
                placeholder={form.unitSystem === 'metric' ? '78' : '172'}
                suffix={form.unitSystem === 'metric' ? 'kg' : 'lb'}
                value={form.unitSystem === 'metric' ? form.targetWeightKg : form.targetWeightLb}
              />
              <OnboardingTextInput
                keyboardType="decimal-pad"
                label="Desired weekly rate"
                onChangeText={(value) =>
                  onboarding.setField(
                    form.unitSystem === 'metric' ? 'weeklyRateKg' : 'weeklyRateLb',
                    value,
                  )
                }
                placeholder={form.unitSystem === 'metric' ? '0.25' : '0.5'}
                suffix={form.unitSystem === 'metric' ? 'kg/week' : 'lb/week'}
                value={form.unitSystem === 'metric' ? form.weeklyRateKg : form.weeklyRateLb}
              />
            </>
          )}
        </StepShell>
      );
    case 'review':
      return (
        <StepShell
          kicker="Review"
          title="Your starting targets"
          description="Confirm these estimates to finish setup."
        >
          {review ? (
            <View style={styles.results}>
              <ResultRow
                label="Daily calories"
                value={`${review.plan.dailyCalories.toLocaleString()} kcal`}
              />
              <ResultRow label="Protein" value={`${review.plan.proteinG} g`} />
              <ResultRow label="Carbs" value={`${review.plan.carbsG} g`} />
              <ResultRow label="Fat" value={`${review.plan.fatG} g`} />
              <View style={styles.divider} />
              <ResultRow
                label="Estimated maintenance"
                value={`${review.plan.tdee.toLocaleString()} kcal`}
              />
              <ResultRow label="Goal" value={formatGoalLabel(review.input.goalType)} />
              {review.input.goalType !== 'maintain' ? (
                <ResultRow
                  label="Calorie adjustment"
                  value={`${review.plan.dailyCalories - review.plan.tdee} kcal/day`}
                />
              ) : null}
            </View>
          ) : (
            <Text style={styles.description}>Go back and complete the missing fields.</Text>
          )}
        </StepShell>
      );
  }
}

function StepShell({
  children,
  description,
  kicker,
  title,
}: {
  children?: ReactNode;
  description?: string;
  kicker: string;
  title: string;
}) {
  return (
    <View style={styles.step}>
      <View>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {children ? <View style={styles.fields}>{children}</View> : null}
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function formatGoalLabel(goalType: string) {
  switch (goalType) {
    case 'lose':
      return 'Lose weight';
    case 'gain':
      return 'Gain weight / muscle';
    default:
      return 'Maintain';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  step: {
    gap: spacing.xl,
  },
  kicker: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  fields: {
    gap: spacing.sm,
  },
  inlineInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
  results: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  resultRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  resultLabel: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  resultValue: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  divider: {
    backgroundColor: colors.borderSubtle,
    height: 1,
    marginVertical: 10,
  },
});
