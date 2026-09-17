import { lbToKg } from '@gymapp/nutrition';
import { useCallback, useEffect, useState } from 'react';

import type { ProgressSnapshot } from '../types/progressTypes';
import { toLocalDate } from '../utils/localDate';
import {
  progressService as defaultProgressService,
  type ProgressService,
} from '../services/progressService';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useProgress(userId?: string, service: ProgressService = defaultProgressService) {
  const [data, setData] = useState<ProgressSnapshot | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) {
      return;
    }
    setStatus('loading');
    setErrorMessage(null);
    try {
      setData(await service.fetchSnapshot(userId));
      setStatus('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load progress.');
      setStatus('error');
    }
  }, [service, userId]);

  useEffect(() => {
    void Promise.resolve().then(() => refetch());
  }, [refetch]);

  const saveCheckIn = useCallback(
    async (rawWeight: string) => {
      const parsed = Number(rawWeight.trim());
      if (!data || !Number.isFinite(parsed) || parsed <= 0) {
        setErrorMessage('Enter a valid weight greater than zero.');
        return false;
      }

      const weightKg = data.unitSystem === 'imperial' ? lbToKg(parsed) : parsed;
      if (!Number.isFinite(weightKg) || weightKg <= 0) {
        setErrorMessage('Enter a valid weight greater than zero.');
        return false;
      }

      setIsSaving(true);
      setErrorMessage(null);
      try {
        await service.saveWeightCheckIn({ weightKg, localDate: toLocalDate(new Date()) });
        await refetch();
        return true;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to save check-in.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [data, refetch, service],
  );

  const changeUnitSystem = useCallback(
    async (unitSystem: 'metric' | 'imperial') => {
      if (!userId) return;
      setErrorMessage(null);
      try {
        await service.updateUnitSystem(userId, unitSystem);
        await refetch();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to update weight units.');
      }
    },
    [refetch, service, userId],
  );

  return { data, status, errorMessage, isSaving, refetch, saveCheckIn, changeUnitSystem };
}
