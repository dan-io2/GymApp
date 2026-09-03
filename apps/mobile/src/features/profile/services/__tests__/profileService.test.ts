import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

import { createProfileService, ProfileQueryError } from '../profileService';

describe('createProfileService', () => {
  it('fetches the current authenticated user profile', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'user-id',
        onboarding_completed: false,
        preferred_unit_system: 'imperial',
      },
      error: null,
    });
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    const service = createProfileService({ from } as unknown as SupabaseClient<Database>);

    await expect(service.getCurrentUserProfile('user-id')).resolves.toEqual({
      id: 'user-id',
      onboardingCompleted: false,
      preferredUnitSystem: 'imperial',
    });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id, onboarding_completed, preferred_unit_system');
    expect(eq).toHaveBeenCalledWith('id', 'user-id');
  });

  it('returns null when no profile exists yet', async () => {
    const service = createProfileService(
      createClientMock({
        data: null,
        error: null,
      }),
    );

    await expect(service.getCurrentUserProfile('user-id')).resolves.toBeNull();
  });

  it('throws a safe sanitized error when the profile query fails', async () => {
    const service = createProfileService(
      createClientMock({
        data: null,
        error: {
          code: '42501',
          message: 'database detail',
        },
      }),
    );

    await expect(service.getCurrentUserProfile('user-id')).rejects.toThrow(
      'Unable to load your profile. Please try again.',
    );
    await expect(service.getCurrentUserProfile('user-id')).rejects.toMatchObject<
      Partial<ProfileQueryError>
    >({
      code: '42501',
    });
  });
});

function createClientMock({
  data,
  error,
}: {
  data: { id: string; onboarding_completed: boolean; preferred_unit_system: string } | null;
  error: { code?: string; message: string } | null;
}): SupabaseClient<Database> {
  const maybeSingle = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));

  return { from } as unknown as SupabaseClient<Database>;
}
