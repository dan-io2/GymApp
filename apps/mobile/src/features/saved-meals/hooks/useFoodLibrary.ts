import { useCallback, useEffect, useState } from 'react';

import type { FoodLog, MealType } from '@/features/diary/types/foodTypes';
import type { FoodSearchResult } from '@/features/food-search/types/foodSearchTypes';

import {
  SavedMealError,
  savedMealService as defaultSavedMealService,
  type SavedMealService,
} from '../services/savedMealService';
import type { FavoriteFood, SavedMeal, SavedMealMultiplier } from '../types/savedMealTypes';

type FoodLibraryStatus = 'idle' | 'loading' | 'success' | 'error';

export type UseFoodLibraryResult = {
  errorMessage: string | null;
  favorites: FavoriteFood[];
  isLoading: boolean;
  message: string | null;
  savedMeals: SavedMeal[];
  status: FoodLibraryStatus;
  addFavorite: (food: FoodSearchResult) => Promise<boolean>;
  clearMessage: () => void;
  createSavedMeal: (input: { logs: FoodLog[]; name: string }) => Promise<boolean>;
  deleteFavorite: (favoriteId: string) => Promise<boolean>;
  deleteSavedMeal: (mealId: string) => Promise<boolean>;
  load: () => Promise<void>;
  logAgain: (log: FoodLog) => Promise<boolean>;
  logSavedMeal: (input: {
    mealId: string;
    mealType: MealType;
    multiplier: SavedMealMultiplier;
  }) => Promise<boolean>;
  removeSavedMealItem: (itemId: string) => Promise<boolean>;
  renameSavedMeal: (input: { mealId: string; name: string }) => Promise<boolean>;
};

export function useFoodLibrary({
  service = defaultSavedMealService,
  userId,
}: {
  service?: SavedMealService;
  userId: string | undefined;
}): UseFoodLibraryResult {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [status, setStatus] = useState<FoodLibraryStatus>(userId ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setSavedMeals([]);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const [nextFavorites, nextSavedMeals] = await Promise.all([
        service.fetchFavorites(userId),
        service.fetchSavedMeals(userId),
      ]);

      setFavorites(nextFavorites);
      setSavedMeals(nextSavedMeals);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(getSavedMealErrorMessage(error, 'Unable to load saved foods.'));
    }
  }, [service, userId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  return {
    errorMessage,
    favorites,
    isLoading: status === 'loading',
    load,
    message,
    savedMeals,
    status,
    async addFavorite(food) {
      if (!userId) {
        setErrorMessage('Sign in before saving favorites.');
        return false;
      }

      setErrorMessage(null);
      setMessage(null);

      try {
        const favorite = await service.addFavorite({ food, userId });
        setFavorites((current) => [favorite, ...current]);
        setMessage('Added to favorites.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't favorite this food."));
        return false;
      }
    },
    clearMessage() {
      setErrorMessage(null);
      setMessage(null);
    },
    async createSavedMeal({ logs, name }) {
      if (!userId) {
        setErrorMessage('Sign in before saving meals.');
        return false;
      }

      setErrorMessage(null);
      setMessage(null);

      try {
        const meal = await service.createSavedMealFromLogs({ logs, name, userId });
        setSavedMeals((current) => [meal, ...current]);
        setMessage('Meal saved.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't save this meal."));
        return false;
      }
    },
    async deleteFavorite(favoriteId) {
      setErrorMessage(null);

      try {
        await service.deleteFavorite({ favoriteId });
        setFavorites((current) => current.filter((favorite) => favorite.id !== favoriteId));
        setMessage('Favorite removed.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't remove this favorite."));
        return false;
      }
    },
    async deleteSavedMeal(mealId) {
      setErrorMessage(null);

      try {
        await service.deleteSavedMeal(mealId);
        setSavedMeals((current) => current.filter((meal) => meal.id !== mealId));
        setMessage('Saved meal deleted.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't delete this saved meal."));
        return false;
      }
    },
    async logAgain(log) {
      setErrorMessage(null);
      setMessage(null);

      try {
        await service.logAgain(log);
        setMessage('Food logged again.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't log this food again."));
        return false;
      }
    },
    async logSavedMeal({ mealId, mealType, multiplier }) {
      setErrorMessage(null);
      setMessage(null);

      try {
        await service.logSavedMeal({ mealId, mealType, multiplier });
        setMessage('Saved meal logged.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't log this saved meal."));
        return false;
      }
    },
    async removeSavedMealItem(itemId) {
      setErrorMessage(null);

      try {
        await service.removeSavedMealItem(itemId);
        setSavedMeals((currentMeals) =>
          currentMeals.map((meal) => ({
            ...meal,
            items: meal.items.filter((item) => item.id !== itemId),
          })),
        );
        setMessage('Item removed.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't remove this item."));
        return false;
      }
    },
    async renameSavedMeal({ mealId, name }) {
      setErrorMessage(null);

      try {
        await service.renameSavedMeal({ mealId, name });
        setSavedMeals((current) =>
          current.map((meal) => (meal.id === mealId ? { ...meal, name } : meal)),
        );
        setMessage('Meal renamed.');
        return true;
      } catch (error) {
        setErrorMessage(getSavedMealErrorMessage(error, "We couldn't rename this meal."));
        return false;
      }
    },
  };
}

function getSavedMealErrorMessage(error: unknown, fallback: string): string {
  return error instanceof SavedMealError || error instanceof Error ? error.message : fallback;
}
