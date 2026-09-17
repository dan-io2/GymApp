import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useProgress } from '../useProgress';
import type { ProgressService } from '../../services/progressService';
import type { ProgressSnapshot, WeightCheckIn } from '../../types/progressTypes';

describe('useProgress', () => {
  it('loads a progress snapshot with no existing weight', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() => useProgress('user-id', service));

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data?.checkIns).toEqual([]);
    expect(result.current.data?.latestCheckIn).toBeNull();
    expect(result.current.data?.changeKg).toBeNull();
  });

  it('reports loading while the initial snapshot is pending', async () => {
    let resolveSnapshot: ((snapshot: ProgressSnapshot) => void) | undefined;
    const pendingSnapshot = new Promise<ProgressSnapshot>((resolve) => {
      resolveSnapshot = resolve;
    });
    const service = createServiceMock({ fetchSnapshot: jest.fn(() => pendingSnapshot) });
    const { result } = renderHook(() => useProgress('user-id', service));

    await waitFor(() => {
      expect(result.current.status).toBe('loading');
    });
    expect(result.current.data).toBeNull();

    await act(async () => {
      resolveSnapshot?.(createSnapshot());
      await pendingSnapshot;
    });
  });

  it.each([
    ['200', 90.718474, '200 lb'],
    ['173.5', 78.698276195, 'decimal lb'],
  ])('converts valid imperial input %s to canonical kilograms (%s)', async (raw, expectedKg) => {
    const service = createServiceMock();
    const { result } = renderHook(() => useProgress('user-id', service));

    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      expect(await result.current.saveCheckIn(raw)).toBe(true);
    });

    expect(service.saveWeightCheckIn).toHaveBeenCalledWith({
      localDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      weightKg: expect.closeTo(expectedKg, 8),
    });
  });

  it.each([
    ['90', 90, 'whole kg'],
    ['90.25', 90.25, 'decimal kg'],
  ])('persists valid metric input %s as canonical kilograms (%s)', async (raw, expectedKg) => {
    const service = createServiceMock({
      fetchSnapshot: jest.fn().mockResolvedValue(createSnapshot({ unitSystem: 'metric' })),
    });
    const { result } = renderHook(() => useProgress('user-id', service));

    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      expect(await result.current.saveCheckIn(raw)).toBe(true);
    });

    expect(service.saveWeightCheckIn).toHaveBeenCalledWith({
      localDate: expect.any(String),
      weightKg: expectedKg,
    });
  });

  it.each(['', '   ', '0', '-20', 'not-a-number', 'NaN', 'Infinity', '5e-324'])(
    'rejects invalid input %p without calling persistence',
    async (raw) => {
      const service = createServiceMock();
      const { result } = renderHook(() => useProgress('user-id', service));

      await waitFor(() => expect(result.current.status).toBe('success'));

      await act(async () => {
        expect(await result.current.saveCheckIn(raw)).toBe(false);
      });

      expect(result.current.errorMessage).toBe('Enter a valid weight greater than zero.');
      expect(service.saveWeightCheckIn).not.toHaveBeenCalled();
    },
  );

  it('refreshes progress after a successful save', async () => {
    const updatedCheckIn = createCheckIn();
    const service = createServiceMock({
      fetchSnapshot: jest
        .fn()
        .mockResolvedValueOnce(createSnapshot())
        .mockResolvedValueOnce(
          createSnapshot({
            checkIns: [updatedCheckIn],
            latestCheckIn: updatedCheckIn,
          }),
        ),
    });
    const { result } = renderHook(() => useProgress('user-id', service));

    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      expect(await result.current.saveCheckIn('200')).toBe(true);
    });

    expect(service.fetchSnapshot).toHaveBeenCalledTimes(2);
    expect(result.current.data?.latestCheckIn).toEqual(updatedCheckIn);
  });

  it('sends the same local date for a second same-day save', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() => useProgress('user-id', service));

    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.saveCheckIn('200');
      await result.current.saveCheckIn('199.5');
    });

    expect(service.saveWeightCheckIn).toHaveBeenCalledTimes(2);
    const firstInput = (service.saveWeightCheckIn as jest.Mock).mock.calls[0][0];
    const secondInput = (service.saveWeightCheckIn as jest.Mock).mock.calls[1][0];
    expect(secondInput.localDate).toBe(firstInput.localDate);
  });
});

function createServiceMock(overrides: Partial<ProgressService> = {}): ProgressService {
  return {
    fetchSnapshot: jest.fn().mockResolvedValue(createSnapshot()),
    fetchWeightHistory: jest.fn().mockResolvedValue([]),
    fetchDiaryDaySummaries: jest.fn().mockResolvedValue([]),
    saveWeightCheckIn: jest.fn().mockResolvedValue(createCheckIn()),
    updateUnitSystem: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createSnapshot(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    unitSystem: 'imperial',
    checkIns: [],
    calendarMonth: [],
    calendarYear: [],
    latestCheckIn: null,
    previousCheckIn: null,
    changeKg: null,
    checkedInThisWeek: false,
    daysSinceLastCheckIn: null,
    consistency: {
      currentStreak: 0,
      longestStreak: 0,
      monthlyConsistencyPercentage: 0,
      monthlyEligibleDays: 1,
      monthlyTrackedDays: 0,
      totalTrackedDays: 0,
    },
    recap: {
      month: '2026-09',
      trackedDays: 0,
      eligibleDays: 1,
      consistencyPercentage: 0,
      longestStreak: 0,
      totalFoodsLogged: 0,
      averageCalories: null,
      averageProteinG: null,
      averageCarbsG: null,
      averageFatG: null,
      calorieTargetDays: null,
      proteinTargetDays: null,
      startingWeightKg: null,
      endingWeightKg: null,
      weightChangeKg: null,
    },
    ...overrides,
  };
}

function createCheckIn(): WeightCheckIn {
  return {
    id: 'check-in-id',
    userId: 'user-id',
    weightKg: 90.72,
    localDate: '2026-09-16',
    recordedAt: '2026-09-16T12:00:00.000Z',
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:00.000Z',
  };
}
