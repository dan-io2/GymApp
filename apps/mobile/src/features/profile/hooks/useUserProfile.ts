import { useCallback, useEffect, useState } from 'react';

import {
  ProfileQueryError,
  profileService as defaultProfileService,
  type ProfileService,
  type UserProfile,
} from '../services/profileService';

type ProfileStatus = 'idle' | 'loading' | 'success' | 'missing' | 'error';
type ProfileRefreshListener = (
  userId: string,
  profile: UserProfile | null,
  sourceId: symbol | null,
) => void;

type UseUserProfileResult = {
  profile: UserProfile | null;
  isLoading: boolean;
  status: ProfileStatus;
  errorMessage: string | null;
  errorCode: string | null;
  refetch: () => Promise<void>;
};

const profileCache = new Map<string, UserProfile | null>();
const profileRefreshListeners = new Set<ProfileRefreshListener>();

export function publishUserProfileRefresh(
  userId: string,
  profile: UserProfile | null,
  sourceId: symbol | null = null,
) {
  const cachedProfile = profileCache.get(userId);

  if (areProfilesEqual(cachedProfile, profile)) {
    return;
  }

  profileCache.set(userId, profile);

  for (const listener of profileRefreshListeners) {
    listener(userId, profile, sourceId);
  }
}

export function useUserProfile(
  userId: string | undefined,
  service: ProfileService = defaultProfileService,
): UseUserProfileResult {
  const [hookId] = useState(() => Symbol('useUserProfile'));
  const cachedProfile = userId ? profileCache.get(userId) : undefined;
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile ?? null);
  const [status, setStatus] = useState<ProfileStatus>(
    userId
      ? cachedProfile === undefined
        ? 'loading'
        : cachedProfile
          ? 'success'
          : 'missing'
      : 'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setStatus('idle');
      setErrorMessage(null);
      setErrorCode(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    setErrorCode(null);

    try {
      const nextProfile = await service.getCurrentUserProfile(userId);

      setProfile(nextProfile);
      publishUserProfileRefresh(userId, nextProfile, hookId);
      setStatus(nextProfile ? 'success' : 'missing');
    } catch (error) {
      setProfile(null);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load your profile.');
      setErrorCode(error instanceof ProfileQueryError ? (error.code ?? null) : null);
    }
  }, [hookId, service, userId]);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          setProfile(null);
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

        return service.getCurrentUserProfile(userId);
      })
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile);
          publishUserProfileRefresh(userId, nextProfile, hookId);
          setStatus(nextProfile ? 'success' : 'missing');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setProfile(null);
          setStatus('error');
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load your profile.');
          setErrorCode(error instanceof ProfileQueryError ? (error.code ?? null) : null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hookId, service, userId]);

  useEffect(() => {
    function handleProfileRefresh(
      nextUserId: string,
      nextProfile: UserProfile | null,
      sourceId: symbol | null,
    ) {
      if (nextUserId !== userId || sourceId === hookId || areProfilesEqual(profile, nextProfile)) {
        return;
      }

      setProfile(nextProfile);
      setStatus(nextProfile ? 'success' : 'missing');
      setErrorMessage(null);
      setErrorCode(null);
    }

    profileRefreshListeners.add(handleProfileRefresh);

    return () => {
      profileRefreshListeners.delete(handleProfileRefresh);
    };
  }, [hookId, profile, userId]);

  return {
    profile,
    isLoading: status === 'loading',
    status,
    errorMessage,
    errorCode,
    refetch: loadProfile,
  };
}

function areProfilesEqual(
  first: UserProfile | null | undefined,
  second: UserProfile | null,
): boolean {
  if (!first || !second) {
    return first === second;
  }

  return (
    first.id === second.id &&
    first.onboardingCompleted === second.onboardingCompleted &&
    first.preferredUnitSystem === second.preferredUnitSystem
  );
}
