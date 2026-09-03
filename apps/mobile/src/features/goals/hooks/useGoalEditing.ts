import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  GoalEditingError,
  goalEditingService as defaultGoalEditingService,
  type GoalEditingService,
} from '../services/goalEditingService';
import type {
  GoalEditingData,
  GoalTargetForm,
  GoalTargetSource,
  GoalTargetValues,
} from '../types/goalEditingTypes';
import { calculateRecommendedTargets, RecommendedTargetError } from '../utils/recommendedTargets';
import { validateGoalTargetForm } from '../utils/goalTargetValidation';

type GoalEditingStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseGoalEditingResult = {
  data: GoalEditingData | null;
  form: GoalTargetForm;
  status: GoalEditingStatus;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  saveErrorMessage: string | null;
  errors: string[];
  warnings: string[];
  macroCalories: number | null;
  macroDifference: number | null;
  updateField: (field: keyof GoalTargetForm, value: string) => void;
  resetToRecommended: () => void;
  save: () => Promise<boolean>;
  refetch: () => Promise<void>;
};

const EMPTY_FORM: GoalTargetForm = {
  dailyCalories: '',
  proteinG: '',
  carbsG: '',
  fatG: '',
};

export function useGoalEditing({
  onSaved,
  service = defaultGoalEditingService,
  userId,
}: {
  onSaved?: (goal: GoalEditingData['activeGoal']) => Promise<void> | void;
  service?: GoalEditingService;
  userId: string | undefined;
}): UseGoalEditingResult {
  const [data, setData] = useState<GoalEditingData | null>(null);
  const [form, setForm] = useState<GoalTargetForm>(EMPTY_FORM);
  const [status, setStatus] = useState<GoalEditingStatus>(userId ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [targetSource, setTargetSource] = useState<GoalTargetSource>('custom');

  const validation = useMemo(() => validateGoalTargetForm(form), [form]);

  const loadData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setForm(EMPTY_FORM);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const nextData = await service.getGoalEditingData(userId);

      setData(nextData);
      setForm(createFormFromValues(nextData.activeGoal));
      setTargetSource(nextData.activeGoal.targetSource);
      setStatus('success');
    } catch (error) {
      setData(null);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load goal editing.');

      if (__DEV__) {
        console.info('[GymApp goal editing]', {
          code: error instanceof GoalEditingError ? (error.code ?? null) : null,
          message: error instanceof Error ? error.message : 'Unable to load goal editing.',
          userId,
        });
      }
    }
  }, [service, userId]);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setData(null);
          setForm(EMPTY_FORM);
          setStatus('idle');
          setErrorMessage(null);
        }
      });

      return () => {
        isMounted = false;
      };
    }

    void Promise.resolve()
      .then(() => {
        if (isMounted) {
          setStatus('loading');
          setErrorMessage(null);
        }

        return service.getGoalEditingData(userId);
      })
      .then((nextData) => {
        if (isMounted) {
          setData(nextData);
          setForm(createFormFromValues(nextData.activeGoal));
          setTargetSource(nextData.activeGoal.targetSource);
          setStatus('success');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setData(null);
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load goal editing.');

          if (__DEV__) {
            console.info('[GymApp goal editing]', {
              code: error instanceof GoalEditingError ? (error.code ?? null) : null,
              message: error instanceof Error ? error.message : 'Unable to load goal editing.',
              userId,
            });
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [service, userId]);

  const updateField = useCallback((field: keyof GoalTargetForm, value: string) => {
    setSaveErrorMessage(null);
    setTargetSource('custom');
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }, []);

  const resetToRecommended = useCallback(() => {
    if (!data) {
      return;
    }

    try {
      const recommended = calculateRecommendedTargets({
        goal: data.activeGoal,
        profile: data.profile,
      });

      setSaveErrorMessage(null);
      setTargetSource('recommended');
      setForm(createFormFromValues(recommended));
    } catch (error) {
      setSaveErrorMessage(
        error instanceof RecommendedTargetError
          ? error.message
          : 'Unable to recalculate recommendations.',
      );
    }
  }, [data]);

  const save = useCallback(async () => {
    const nextValidation = validateGoalTargetForm(form);

    if (!nextValidation.isValid) {
      setSaveErrorMessage('Please fix the highlighted target values before saving.');
      return false;
    }

    if (__DEV__) {
      console.info('[GymApp goal save]', {
        dailyCalories: nextValidation.values.dailyCalories,
        proteinG: nextValidation.values.proteinG,
        carbsG: nextValidation.values.carbsG,
        fatG: nextValidation.values.fatG,
        targetSource,
        rpc: 'replace_active_nutrition_goal',
      });
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const newGoal = await service.replaceActiveGoalTargets(nextValidation.values, targetSource);

      if (__DEV__) {
        console.info('[GymApp goal save result]', {
          goalId: newGoal.id,
          dailyCalories: newGoal.dailyCalories,
          proteinG: newGoal.proteinG,
          carbsG: newGoal.carbsG,
          fatG: newGoal.fatG,
          targetSource: newGoal.targetSource,
        });
      }

      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              activeGoal: newGoal,
            }
          : currentData,
      );
      setForm(createFormFromValues(newGoal));
      await onSaved?.(newGoal);
      return true;
    } catch (error) {
      if (__DEV__) {
        console.info('[GymApp goal save failed]', {
          code: error instanceof GoalEditingError ? (error.code ?? null) : null,
          message: error instanceof Error ? error.message : 'Unable to save nutrition targets.',
        });
      }

      setSaveErrorMessage(
        error instanceof Error ? error.message : 'Unable to save your nutrition targets.',
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [form, onSaved, service, targetSource]);

  return {
    data,
    form,
    status,
    isLoading: status === 'loading',
    isSaving,
    errorMessage,
    saveErrorMessage,
    errors: validation.isValid ? [] : validation.errors,
    warnings: validation.warnings,
    macroCalories: validation.macroSummary?.macroCalories ?? null,
    macroDifference: validation.macroSummary?.difference ?? null,
    updateField,
    resetToRecommended,
    save,
    refetch: loadData,
  };
}

function createFormFromValues(values: GoalTargetValues): GoalTargetForm {
  return {
    dailyCalories: values.dailyCalories.toString(),
    proteinG: values.proteinG.toString(),
    carbsG: values.carbsG.toString(),
    fatG: values.fatG.toString(),
  };
}
