import type { SupabaseClient } from '@supabase/supabase-js';

import { createProgressService } from '../progressService';
import type { Database } from '@/types/database';

describe('progressService', () => {
  it('sends canonical kilograms to the weight check-in RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: createBodyMetricRow(), error: null });
    const service = createProgressService({ rpc } as unknown as SupabaseClient<Database>);

    await expect(
      service.saveWeightCheckIn({
        weightKg: 90.718474,
        localDate: '2026-09-16',
        recordedAt: new Date('2026-09-16T19:00:00.000Z'),
      }),
    ).resolves.toEqual(expect.objectContaining({ weightKg: 90.72 }));

    expect(rpc).toHaveBeenCalledWith('upsert_weight_check_in', {
      p_local_date: '2026-09-16',
      p_recorded_at: '2026-09-16T19:00:00.000Z',
      p_weight_kg: 90.718474,
    });
  });

  it('uses the same upsert RPC and local date for a second same-day save', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValueOnce({ data: createBodyMetricRow(), error: null })
      .mockResolvedValueOnce({
        data: createBodyMetricRow({ weight_kg: 90.49, updated_at: '2026-09-16T20:00:00.000Z' }),
        error: null,
      });
    const service = createProgressService({ rpc } as unknown as SupabaseClient<Database>);

    await service.saveWeightCheckIn({
      weightKg: 90.72,
      localDate: '2026-09-16',
      recordedAt: new Date('2026-09-16T19:00:00.000Z'),
    });
    const updated = await service.saveWeightCheckIn({
      weightKg: 90.49,
      localDate: '2026-09-16',
      recordedAt: new Date('2026-09-16T20:00:00.000Z'),
    });

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[0][1].p_local_date).toBe('2026-09-16');
    expect(rpc.mock.calls[1][1].p_local_date).toBe('2026-09-16');
    expect(updated).toEqual(expect.objectContaining({ id: 'check-in-id', weightKg: 90.49 }));
  });
});

function createBodyMetricRow(
  overrides: Partial<Database['public']['Tables']['body_metrics']['Row']> = {},
) {
  return {
    id: 'check-in-id',
    user_id: 'user-id',
    weight_kg: 90.72,
    body_fat_percentage: null,
    local_date: '2026-09-16',
    recorded_at: '2026-09-16T19:00:00.000Z',
    created_at: '2026-09-16T19:00:00.000Z',
    updated_at: '2026-09-16T19:00:00.000Z',
    ...overrides,
  };
}
