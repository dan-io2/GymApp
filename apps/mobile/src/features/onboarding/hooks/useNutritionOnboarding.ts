import { useMemo, useReducer, useState } from 'react';

import type { UserProfile } from '@/features/profile/services/profileService';

import { ONBOARDING_STEPS } from '../constants/onboardingOptions';
import {
  onboardingService as defaultOnboardingService,
  type OnboardingService,
} from '../services/onboardingService';
import type {
  OnboardingFormState,
  OnboardingReview,
  OnboardingStepId,
  UnitSystem,
} from '../types/onboardingTypes';
import { createInitialOnboardingState, switchUnitSystem } from '../utils/unitConversion';
import { buildOnboardingReview } from '../utils/onboardingValidation';

type OnboardingAction =
  | {
      type: 'setField';
      field: keyof OnboardingFormState;
      value: string;
    }
  | {
      type: 'setSelection';
      field: 'activityLevel' | 'goalType' | 'sexForCalculation';
      value: OnboardingSelectionValue;
    }
  | {
      type: 'setUnitSystem';
      value: UnitSystem;
    };

type OnboardingSelectionValue =
  | OnboardingFormState['activityLevel']
  | OnboardingFormState['goalType']
  | OnboardingFormState['sexForCalculation'];

type UseNutritionOnboardingOptions = {
  onCompleted: () => Promise<void> | void;
  profile: UserProfile | null;
  service?: OnboardingService;
  userId: string;
};

export type NutritionOnboardingState = {
  currentStep: OnboardingStepId;
  currentStepIndex: number;
  errors: string[];
  form: OnboardingFormState;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSaving: boolean;
  review: OnboardingReview | null;
  saveErrorMessage: string | null;
};

export function useNutritionOnboarding({
  onCompleted,
  profile,
  service = defaultOnboardingService,
  userId,
}: UseNutritionOnboardingOptions) {
  const [form, dispatch] = useReducer(
    onboardingReducer,
    createInitialOnboardingState(profile?.preferredUnitSystem ?? 'imperial'),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const reviewResult = useMemo(() => buildOnboardingReview(form), [form]);
  const review = reviewResult.ok ? reviewResult.data : null;

  function setField(field: keyof OnboardingFormState, value: string) {
    dispatch({
      type: 'setField',
      field,
      value,
    });
  }

  function setSelection(
    field: 'activityLevel' | 'goalType' | 'sexForCalculation',
    value: OnboardingSelectionValue,
  ) {
    dispatch({
      type: 'setSelection',
      field,
      value,
    });
  }

  function setUnitSystem(value: UnitSystem) {
    dispatch({
      type: 'setUnitSystem',
      value,
    });
  }

  function goBack() {
    setErrors([]);
    setSaveErrorMessage(null);
    setCurrentStepIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    const stepErrors = validateStep(currentStep, form);

    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (currentStep === 'review' && !reviewResult.ok) {
      setErrors(reviewResult.errors);
      return;
    }

    setErrors([]);
    setSaveErrorMessage(null);
    setCurrentStepIndex((value) => Math.min(ONBOARDING_STEPS.length - 1, value + 1));
  }

  async function save() {
    if (!review) {
      setErrors(
        reviewResult.ok ? ['Review your onboarding answers before saving.'] : reviewResult.errors,
      );
      return;
    }

    setErrors([]);
    setSaveErrorMessage(null);
    setIsSaving(true);

    try {
      await service.completeOnboarding({
        ...review.input,
        userId,
        plan: review.plan,
      });
      await onCompleted();
    } catch (error) {
      setSaveErrorMessage(
        error instanceof Error
          ? error.message
          : 'Your nutrition setup could not be saved. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return {
    state: {
      currentStep,
      currentStepIndex,
      errors,
      form,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === ONBOARDING_STEPS.length - 1,
      isSaving,
      review,
      saveErrorMessage,
    } satisfies NutritionOnboardingState,
    goBack,
    goNext,
    save,
    setField,
    setSelection,
    setUnitSystem,
  };
}

function onboardingReducer(
  state: OnboardingFormState,
  action: OnboardingAction,
): OnboardingFormState {
  switch (action.type) {
    case 'setField':
      return {
        ...state,
        [action.field]: action.value,
      };
    case 'setSelection':
      return {
        ...state,
        [action.field]: action.value,
      };
    case 'setUnitSystem':
      return switchUnitSystem(state, action.value);
  }
}

export function validateStep(step: OnboardingStepId, form: OnboardingFormState): string[] {
  const reviewResult = buildOnboardingReview(form);
  const allErrors = reviewResult.ok ? [] : reviewResult.errors;

  switch (step) {
    case 'welcome':
    case 'units':
      return [];
    case 'dateOfBirth':
      return allErrors.filter((error) => error.includes('birth') || error.includes('date'));
    case 'sex':
      return allErrors.filter((error) => error.includes('sex'));
    case 'height':
      return allErrors.filter((error) => error.includes('height'));
    case 'weight':
      return allErrors.filter((error) => error.includes('current weight'));
    case 'activity':
      return allErrors.filter((error) => error.includes('activity'));
    case 'goal':
      return allErrors.filter((error) => error.includes('goal'));
    case 'target':
      return allErrors.filter(
        (error) => error.includes('target weight') || error.includes('weekly rate'),
      );
    case 'review':
      return allErrors;
  }
}
