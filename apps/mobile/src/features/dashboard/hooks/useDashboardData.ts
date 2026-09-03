import { useCallback, useEffect, useState } from 'react';

import {
  DashboardDataError,
  dashboardService as defaultDashboardService,
  type DashboardService,
} from '../services/dashboardService';
import type { DashboardData } from '../types/dashboardTypes';

type DashboardStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseDashboardDataResult = {
  data: DashboardData | null;
  status: DashboardStatus;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  refetch: () => Promise<void>;
};

export function useDashboardData(
  userId: string | undefined,
  service: DashboardService = defaultDashboardService,
): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<DashboardStatus>(userId ? 'loading' : 'idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async ({ refreshing = false }: { refreshing?: boolean } = {}) => {
      if (!userId) {
        setData(null);
        setStatus('idle');
        setErrorMessage(null);
        setErrorCode(null);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setStatus('loading');
      }

      setErrorMessage(null);
      setErrorCode(null);

      try {
        const nextData = await service.getDashboardData(userId);

        setData(nextData);
        setStatus('success');
      } catch (error) {
        const nextErrorMessage =
          error instanceof Error ? error.message : 'Unable to load your dashboard.';

        setStatus('error');
        setErrorMessage(nextErrorMessage);
        setErrorCode(error instanceof DashboardDataError ? (error.code ?? null) : null);

        if (__DEV__) {
          console.info('[GymApp dashboard]', {
            errorCode: error instanceof DashboardDataError ? (error.code ?? null) : null,
            message: nextErrorMessage,
            userId,
          });
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [service, userId],
  );

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setData(null);
          setStatus('idle');
          setErrorMessage(null);
          setErrorCode(null);
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
          setErrorCode(null);
        }

        return service.getDashboardData(userId);
      })
      .then((nextData) => {
        if (isMounted) {
          setData(nextData);
          setStatus('success');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const nextErrorMessage =
            error instanceof Error ? error.message : 'Unable to load your dashboard.';

          setStatus('error');
          setErrorMessage(nextErrorMessage);
          setErrorCode(error instanceof DashboardDataError ? (error.code ?? null) : null);

          if (__DEV__) {
            console.info('[GymApp dashboard]', {
              errorCode: error instanceof DashboardDataError ? (error.code ?? null) : null,
              message: nextErrorMessage,
              userId,
            });
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [service, userId]);

  const refetch = useCallback(() => loadDashboardData({ refreshing: true }), [loadDashboardData]);

  return {
    data,
    status,
    isLoading: status === 'loading',
    isRefreshing,
    errorMessage,
    errorCode,
    refetch,
  };
}
