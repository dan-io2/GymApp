import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useUserProfile } from '../useUserProfile';
import type { ProfileService } from '../../services/profileService';

describe('useUserProfile', () => {
  it('refetches profile state when the profile value changes', async () => {
    const getCurrentUserProfile = jest
      .fn<
        ReturnType<ProfileService['getCurrentUserProfile']>,
        Parameters<ProfileService['getCurrentUserProfile']>
      >()
      .mockResolvedValueOnce({
        id: 'user-id',
        onboardingCompleted: false,
        preferredUnitSystem: 'imperial',
      })
      .mockResolvedValueOnce({
        id: 'user-id',
        onboardingCompleted: true,
        preferredUnitSystem: 'imperial',
      });
    const service: ProfileService = { getCurrentUserProfile };

    const { result } = renderHook(() => useUserProfile('user-id', service));

    await waitFor(() => {
      expect(result.current.profile?.onboardingCompleted).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.profile?.onboardingCompleted).toBe(true);
    expect(getCurrentUserProfile).toHaveBeenCalledTimes(2);
  });
});
