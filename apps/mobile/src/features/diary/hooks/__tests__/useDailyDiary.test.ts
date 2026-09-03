import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDailyDiary } from '../useDailyDiary';
import type { FoodDiaryService } from '../../services/foodDiaryService';
import type { FoodLog } from '../../types/foodTypes';
import { aggregateDailyNutrition } from '../../utils/foodDiaryUtils';

describe('useDailyDiary', () => {
  it('groups breakfast, lunch, dinner, and snack logs and calculates daily totals', async () => {
    const date = new Date('2026-08-10T12:00:00');
    const logs = [
      createLog({ id: 'breakfast-log', mealType: 'breakfast', calories: 120 }),
      createLog({ id: 'lunch-log', mealType: 'lunch', calories: 160 }),
      createLog({ id: 'dinner-log', mealType: 'dinner', calories: 220 }),
      createLog({ id: 'snack-log', mealType: 'snack', calories: 80 }),
    ];
    const { result } = renderHook(() =>
      useDailyDiary({
        date,
        service: createServiceMock({ fetchLogsForLocalDate: jest.fn().mockResolvedValue(logs) }),
        targets: {
          dailyCalories: 2400,
          proteinG: 210,
          carbsG: 230,
          fatG: 72,
        },
        userId: 'user-id',
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.mealGroups.map((group) => group.mealType)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
      'snack',
    ]);
    expect(result.current.totals.caloriesConsumed).toBe(580);
    expect(result.current.progress?.calories.remaining).toBe(1820);
  });

  it('updates quantity and meal type using the service result', async () => {
    const date = new Date('2026-08-10T12:00:00');
    const initialLog = createLog({ quantity: 1 });
    const updatedLog = createLog({
      calories: 320,
      carbsG: 72,
      id: initialLog.id,
      mealType: 'lunch',
      proteinG: 6,
      quantity: 2,
    });
    const service = createServiceMock({
      fetchLogsForLocalDate: jest.fn().mockResolvedValue([initialLog]),
      updateLog: jest.fn().mockResolvedValue(updatedLog),
    });
    const { result } = renderHook(() =>
      useDailyDiary({
        date,
        service,
        targets: null,
        userId: 'user-id',
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.updateLog({ log: initialLog, mealType: 'lunch', quantity: 2 });
    });

    expect(service.updateLog).toHaveBeenCalledWith({
      log: initialLog,
      mealType: 'lunch',
      quantity: 2,
    });
    expect(result.current.logs[0]).toEqual(updatedLog);
  });

  it('deletes logs and refreshes totals locally', async () => {
    const date = new Date('2026-08-10T12:00:00');
    const service = createServiceMock({
      fetchLogsForLocalDate: jest
        .fn()
        .mockResolvedValue([createLog(), createLog({ id: 'delete-me' })]),
    });
    const { result } = renderHook(() =>
      useDailyDiary({
        date,
        service,
        targets: null,
        userId: 'user-id',
      }),
    );

    await waitFor(() => expect(result.current.logs).toHaveLength(2));

    await act(async () => {
      await result.current.deleteLog('delete-me');
    });

    expect(service.deleteLog).toHaveBeenCalledWith('delete-me');
    expect(result.current.logs).toHaveLength(1);
  });

  it('keeps another user logs out when the service returns only owner-scoped rows', async () => {
    const date = new Date('2026-08-10T12:00:00');
    const service = createServiceMock({
      fetchLogsForLocalDate: jest.fn().mockResolvedValue([createLog({ userId: 'user-id' })]),
    });

    renderHook(() =>
      useDailyDiary({
        date,
        service,
        targets: null,
        userId: 'user-id',
      }),
    );

    await waitFor(() => {
      expect(service.fetchLogsForLocalDate).toHaveBeenCalledWith('user-id', date);
    });
  });
});

function createServiceMock(overrides: Partial<FoodDiaryService> = {}): FoodDiaryService {
  return {
    addLog: jest.fn(),
    calculateTotals: aggregateDailyNutrition,
    deleteLog: jest.fn().mockResolvedValue(undefined),
    fetchLogsForLocalDate: jest.fn().mockResolvedValue([]),
    updateLog: jest.fn(),
    updateQuantity: jest.fn(),
    ...overrides,
  };
}

function createLog(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'log-id',
    userId: 'user-id',
    foodId: null,
    mealType: 'lunch',
    foodName: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    quantity: 1,
    itemQuantity: overrides.itemQuantity ?? 1,
    portionAmount: overrides.portionAmount ?? 1,
    portionUnit: overrides.portionUnit ?? 'serving',
    servingEquivalent: overrides.servingEquivalent ?? 1,
    servingSize: 45,
    servingUnit: 'g',
    servingCalories: 160,
    servingProteinG: 3,
    servingCarbsG: 36,
    servingFatG: 0,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: 160,
    proteinG: 3,
    carbsG: 36,
    fatG: 0,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    loggedAt: '2026-08-10T12:00:00Z',
    createdAt: '2026-08-10T12:00:00Z',
    ...overrides,
  };
}
