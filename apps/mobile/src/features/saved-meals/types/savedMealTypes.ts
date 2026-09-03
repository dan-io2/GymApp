import type { FoodLog, MealType } from '@/features/diary/types/foodTypes';
import type { FoodSearchResult } from '@/features/food-search/types/foodSearchTypes';

export type SavedMealMultiplier = 0.5 | 1 | 2;

export type FavoriteFood = {
  id: string;
  foodId: string;
  createdAt: string;
  food: FoodSearchResult;
};

export type SavedMealItem = {
  id: string;
  savedMealId: string;
  foodId: string | null;
  foodName: string;
  brand: string | null;
  quantity: number;
  itemQuantity: number;
  portionAmount: number;
  portionUnit: string;
  servingEquivalent: number;
  servingSize: number | null;
  servingUnit: string | null;
  servingCalories: number;
  servingProteinG: number;
  servingCarbsG: number;
  servingFatG: number;
  servingFiberG: number | null;
  servingSugarG: number | null;
  servingSodiumMg: number | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  sortOrder: number;
  createdAt: string;
};

export type SavedMeal = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: SavedMealItem[];
};

export type CreateSavedMealInput = {
  logs: FoodLog[];
  name: string;
  userId: string;
};

export type LogSavedMealInput = {
  mealId: string;
  mealType: MealType;
  multiplier: SavedMealMultiplier;
};
