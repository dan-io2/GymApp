import { useCallback, useEffect, useState } from 'react';

import type { FoodLog, MealType, NutritionTargets } from '../types/foodTypes';
import {
  aggregateDailyNutrition,
  calculateNutritionProgress,
  groupLogsByMeal,
} from '../utils/foodDiaryUtils';
import {
  FoodDiaryError,
  foodDiaryService as defaultFoodDiaryService,
  type FoodDiaryService,
} from '../services/foodDiaryService';

type DailyDiaryStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseDailyDiaryResult = {
  logs: FoodLog[];
  status: DailyDiaryStatus;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  savingLogId: string | null;
  deletingLogId: string | null;
  totals: ReturnType<typeof aggregateDailyNutrition>;
  progress: ReturnType<typeof calculateNutritionProgress> | null;
  mealGroups: ReturnType<typeof groupLogsByMeal>;
  refetch: () => Promise<void>;
  updateLog: (input: {
    itemQuantity?: number;
    log: FoodLog;
    mealType: MealType;
    portionAmount?: number;
    portionUnit?: string;
    quantity: number;
  }) => Promise<boolean>;
  deleteLog: (logId: string) => Promise<boolean>;
};

export function useDailyDiary({
  date,
  service = defaultFoodDiaryService,
  targets,
  userId,
}: {
  date: Date;
  service?: FoodDiaryService;
  targets: NutritionTargets | null;
  userId: string | undefined;
}): UseDailyDiaryResult {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [status, setStatus] = useState<DailyDiaryStatus>(userId ? 'loading' : 'idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingLogId, setSavingLogId] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  const loadDiary = useCallback(
    async ({ refreshing = false }: { refreshing?: boolean } = {}) => {
      if (!userId) {
        setLogs([]);
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setStatus('loading');
      }

      setErrorMessage(null);

      try {
        const nextLogs = await service.fetchLogsForLocalDate(userId, date);

        setLogs(nextLogs);
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load your diary.');
      } finally {
        setIsRefreshing(false);
      }
    },
    [date, service, userId],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadDiary());
  }, [loadDiary]);

  const totals = aggregateDailyNutrition(logs);

  const refetch = useCallback(() => loadDiary({ refreshing: true }), [loadDiary]);

  return {
    logs,
    status,
    isLoading: status === 'loading',
    isRefreshing,
    errorMessage,
    savingLogId,
    deletingLogId,
    totals,
    progress: targets ? calculateNutritionProgress(targets, totals) : null,
    mealGroups: groupLogsByMeal(logs),
    refetch,
    async updateLog({ itemQuantity, log, mealType, portionAmount, portionUnit, quantity }) {
      setSavingLogId(log.id);
      setErrorMessage(null);

      try {
        const updatedLog = await service.updateLog({
          log,
          itemQuantity,
          mealType,
          portionAmount,
          portionUnit,
          quantity,
        });

        setLogs((currentLogs) =>
          currentLogs.map((currentLog) =>
            currentLog.id === updatedLog.id ? updatedLog : currentLog,
          ),
        );
        return true;
      } catch (error) {
        setErrorMessage(
          error instanceof FoodDiaryError
            ? error.message
            : "We couldn't update this diary item. Please try again.",
        );
        return false;
      } finally {
        setSavingLogId(null);
      }
    },
    async deleteLog(logId) {
      setDeletingLogId(logId);
      setErrorMessage(null);

      try {
        await service.deleteLog(logId);
        setLogs((currentLogs) => currentLogs.filter((log) => log.id !== logId));
        return true;
      } catch (error) {
        setErrorMessage(
          error instanceof FoodDiaryError
            ? error.message
            : "We couldn't delete this diary item. Please try again.",
        );
        return false;
      } finally {
        setDeletingLogId(null);
      }
    },
  };
}
