import type { SupabaseClient } from '@supabase/supabase-js';

import { mapFoodLog } from '@/features/diary/services/foodDiaryService';
import type { FoodLog, FoodSource } from '@/features/diary/types/foodTypes';
import type { FoodSearchResult, ServingBasis } from '@/features/food-search/types/foodSearchTypes';
import { supabase } from '@/lib/supabase';
import type { Database, Tables, TablesInsert } from '@/types/database';

import type {
  CreateSavedMealInput,
  FavoriteFood,
  LogSavedMealInput,
  SavedMeal,
  SavedMealItem,
} from '../types/savedMealTypes';
import {
  createSavedMealItemInsert,
  isValidSavedMealName,
  normalizeSavedMealName,
} from '../utils/savedMealSnapshots';

export class SavedMealError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'SavedMealError';
  }
}

export type SavedMealService = {
  addFavorite: (input: { food: FoodSearchResult; userId: string }) => Promise<FavoriteFood>;
  deleteFavorite: (input: { favoriteId: string }) => Promise<void>;
  fetchFavorites: (userId: string) => Promise<FavoriteFood[]>;
  fetchSavedMeals: (userId: string) => Promise<SavedMeal[]>;
  createSavedMealFromLogs: (input: CreateSavedMealInput) => Promise<SavedMeal>;
  renameSavedMeal: (input: { mealId: string; name: string }) => Promise<void>;
  removeSavedMealItem: (itemId: string) => Promise<void>;
  deleteSavedMeal: (mealId: string) => Promise<void>;
  logAgain: (log: FoodLog) => Promise<FoodLog>;
  logSavedMeal: (input: LogSavedMealInput) => Promise<FoodLog[]>;
};

type FoodRow = Tables<'foods'>;
type FoodLogRow = Tables<'food_logs'>;
type SavedMealRow = Tables<'saved_meals'>;
type SavedMealItemRow = Tables<'saved_meal_items'>;

type FavoriteFoodRow = Tables<'favorite_foods'> & {
  foods: FoodRow | null;
};

export function createSavedMealService(client: SupabaseClient<Database>): SavedMealService {
  return {
    async fetchFavorites(userId) {
      const { data, error } = await client
        .from('favorite_foods')
        .select(
          'id, user_id, food_id, created_at, foods(id, external_id, source, barcode, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, created_by, created_at, updated_at)',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new SavedMealError('Unable to load favorite foods.', error.code);
      }

      return ((data ?? []) as FavoriteFoodRow[])
        .filter((row) => row.foods !== null)
        .map((row) => mapFavoriteFood(row));
    },

    async addFavorite({ food, userId }) {
      const foodId = await ensureFavoriteFoodRow({ client, food, userId });
      const { data, error } = await client
        .from('favorite_foods')
        .insert({
          food_id: foodId,
          user_id: userId,
        })
        .select(
          'id, user_id, food_id, created_at, foods(id, external_id, source, barcode, name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, created_by, created_at, updated_at)',
        )
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new SavedMealError('This food is already in your favorites.', error.code);
        }

        throw new SavedMealError("We couldn't favorite this food. Please try again.", error.code);
      }

      return mapFavoriteFood(data as FavoriteFoodRow);
    },

    async deleteFavorite({ favoriteId }) {
      const { error } = await client.from('favorite_foods').delete().eq('id', favoriteId);

      if (error) {
        throw new SavedMealError("We couldn't remove this favorite. Please try again.", error.code);
      }
    },

    async fetchSavedMeals(userId) {
      const { data: mealRows, error: mealError } = await client
        .from('saved_meals')
        .select('id, user_id, name, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (mealError) {
        throw new SavedMealError('Unable to load saved meals.', mealError.code);
      }

      const mealIds = (mealRows ?? []).map((meal) => meal.id);

      if (mealIds.length === 0) {
        return [];
      }

      const { data: itemRows, error: itemError } = await client
        .from('saved_meal_items')
        .select('*')
        .in('saved_meal_id', mealIds)
        .order('sort_order', { ascending: true });

      if (itemError) {
        throw new SavedMealError('Unable to load saved meal items.', itemError.code);
      }

      return mapSavedMeals(mealRows ?? [], itemRows ?? []);
    },

    async createSavedMealFromLogs({ logs, name, userId }) {
      const normalizedName = normalizeSavedMealName(name);

      if (!isValidSavedMealName(normalizedName)) {
        throw new SavedMealError('Enter a saved meal name between 1 and 80 characters.');
      }

      if (logs.length === 0) {
        throw new SavedMealError('Add at least one food before saving this meal.');
      }

      const { data: meal, error: mealError } = await client
        .from('saved_meals')
        .insert({
          name: normalizedName,
          user_id: userId,
        })
        .select()
        .single();

      if (mealError) {
        throw new SavedMealError("We couldn't save this meal. Please try again.", mealError.code);
      }

      const items = logs.map((log, index) => createSavedMealItemInsert(log, meal.id, index));
      const { data: insertedItems, error: itemError } = await client
        .from('saved_meal_items')
        .insert(items)
        .select();

      if (itemError) {
        await client.from('saved_meals').delete().eq('id', meal.id);
        throw new SavedMealError("We couldn't save this meal. Please try again.", itemError.code);
      }

      return {
        ...mapSavedMealRow(meal),
        items: (insertedItems ?? []).map(mapSavedMealItem),
      };
    },

    async renameSavedMeal({ mealId, name }) {
      const normalizedName = normalizeSavedMealName(name);

      if (!isValidSavedMealName(normalizedName)) {
        throw new SavedMealError('Enter a saved meal name between 1 and 80 characters.');
      }

      const { error } = await client
        .from('saved_meals')
        .update({ name: normalizedName })
        .eq('id', mealId);

      if (error) {
        throw new SavedMealError("We couldn't rename this meal. Please try again.", error.code);
      }
    },

    async removeSavedMealItem(itemId) {
      const { error } = await client.from('saved_meal_items').delete().eq('id', itemId);

      if (error) {
        throw new SavedMealError(
          "We couldn't remove this meal item. Please try again.",
          error.code,
        );
      }
    },

    async deleteSavedMeal(mealId) {
      const { error } = await client.from('saved_meals').delete().eq('id', mealId);

      if (error) {
        throw new SavedMealError(
          "We couldn't delete this saved meal. Please try again.",
          error.code,
        );
      }
    },

    async logAgain(log) {
      const insert: TablesInsert<'food_logs'> = {
        user_id: log.userId,
        food_id: log.foodId,
        meal_type: log.mealType,
        food_name: log.foodName,
        brand: log.brand,
        quantity: log.quantity,
        item_quantity: log.itemQuantity,
        portion_amount: log.portionAmount,
        portion_unit: log.portionUnit,
        serving_equivalent: log.servingEquivalent,
        serving_size: log.servingSize,
        serving_unit: log.servingUnit,
        serving_calories: log.servingCalories,
        serving_protein_g: log.servingProteinG,
        serving_carbs_g: log.servingCarbsG,
        serving_fat_g: log.servingFatG,
        serving_fiber_g: log.servingFiberG,
        serving_sugar_g: log.servingSugarG,
        serving_sodium_mg: log.servingSodiumMg,
        calories: log.calories,
        protein_g: log.proteinG,
        carbs_g: log.carbsG,
        fat_g: log.fatG,
        fiber_g: log.fiberG,
        sugar_g: log.sugarG,
        sodium_mg: log.sodiumMg,
      };
      const { data, error } = await client.from('food_logs').insert(insert).select().single();

      if (error) {
        throw new SavedMealError("We couldn't log this food again. Please try again.", error.code);
      }

      return mapFoodLog(data);
    },

    async logSavedMeal({ mealId, mealType, multiplier }) {
      const { data, error } = await client.rpc('log_saved_meal', {
        p_meal_type: mealType,
        p_multiplier: multiplier,
        p_saved_meal_id: mealId,
      });

      if (error) {
        if (__DEV__) {
          console.info('[GymApp saved meal rpc]', {
            code: error.code,
            message: error.message,
            operation: 'log_saved_meal',
          });
        }

        throw new SavedMealError("We couldn't log this saved meal. Please try again.", error.code);
      }

      return ((data ?? []) as FoodLogRow[]).map(mapFoodLog);
    },
  };
}

export const savedMealService = createSavedMealService(supabase);

async function ensureFavoriteFoodRow({
  client,
  food,
  userId,
}: {
  client: SupabaseClient<Database>;
  food: FoodSearchResult;
  userId: string;
}): Promise<string> {
  if (food.id) {
    return food.id;
  }

  const externalId = createUserFoodExternalId(food, userId);
  const { data: existingFood, error: selectError } = await client
    .from('foods')
    .select('id')
    .eq('source', 'user')
    .eq('created_by', userId)
    .eq('external_id', externalId)
    .maybeSingle();

  if (selectError) {
    throw new SavedMealError("We couldn't favorite this food. Please try again.", selectError.code);
  }

  if (existingFood?.id) {
    return existingFood.id;
  }

  const insert: TablesInsert<'foods'> = {
    source: 'user',
    created_by: userId,
    external_id: externalId,
    barcode: food.barcode,
    name: food.name,
    brand: food.brand,
    serving_size: food.servingSize,
    serving_unit: food.servingUnit,
    calories: food.calories,
    protein_g: food.proteinG,
    carbs_g: food.carbsG,
    fat_g: food.fatG,
    fiber_g: food.fiberG,
    sugar_g: food.sugarG,
    sodium_mg: food.sodiumMg,
  };
  const { data: insertedFood, error: insertError } = await client
    .from('foods')
    .insert(insert)
    .select('id')
    .single();

  if (insertError) {
    throw new SavedMealError("We couldn't favorite this food. Please try again.", insertError.code);
  }

  return insertedFood.id;
}

function createUserFoodExternalId(food: FoodSearchResult, userId: string): string {
  return `favorite:${userId}:${food.source}:${food.externalId}`;
}

function mapFavoriteFood(row: FavoriteFoodRow): FavoriteFood {
  if (!row.foods) {
    throw new SavedMealError('Favorite food is missing its food record.');
  }

  return {
    id: row.id,
    foodId: row.food_id,
    createdAt: row.created_at,
    food: mapFoodRowToSearchResult(row.foods, 'Favorite'),
  };
}

function mapFoodRowToSearchResult(row: FoodRow, sourceLabel: string): FoodSearchResult {
  return {
    id: row.id,
    externalId: row.external_id ?? row.id,
    source: toFoodSource(row.source),
    sourceLabel,
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    servingDescription:
      row.serving_size && row.serving_unit ? `${row.serving_size} ${row.serving_unit}` : null,
    servingsPerContainer: null,
    servingBasis: getServingBasis(row),
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    sodiumMg: row.sodium_mg,
  };
}

function getServingBasis(row: FoodRow): ServingBasis {
  return row.serving_size === null ? 'unknown' : 'per_serving';
}

function toFoodSource(source: string): FoodSource {
  if (
    source === 'usda' ||
    source === 'open_food_facts' ||
    source === 'fatsecret' ||
    source === 'user'
  ) {
    return source;
  }

  return 'internal';
}

function mapSavedMeals(mealRows: SavedMealRow[], itemRows: SavedMealItemRow[]): SavedMeal[] {
  const itemsByMealId = new Map<string, SavedMealItem[]>();

  itemRows.forEach((row) => {
    const mealItems = itemsByMealId.get(row.saved_meal_id) ?? [];
    mealItems.push(mapSavedMealItem(row));
    itemsByMealId.set(row.saved_meal_id, mealItems);
  });

  return mealRows.map((meal) => ({
    ...mapSavedMealRow(meal),
    items: itemsByMealId.get(meal.id) ?? [],
  }));
}

function mapSavedMealRow(row: SavedMealRow): Omit<SavedMeal, 'items'> {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSavedMealItem(row: SavedMealItemRow): SavedMealItem {
  return {
    id: row.id,
    savedMealId: row.saved_meal_id,
    foodId: row.food_id,
    foodName: row.food_name,
    brand: row.brand,
    quantity: row.quantity,
    itemQuantity: row.item_quantity,
    portionAmount: row.portion_amount,
    portionUnit: row.portion_unit,
    servingEquivalent: row.serving_equivalent,
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    servingCalories: row.serving_calories,
    servingProteinG: row.serving_protein_g,
    servingCarbsG: row.serving_carbs_g,
    servingFatG: row.serving_fat_g,
    servingFiberG: row.serving_fiber_g,
    servingSugarG: row.serving_sugar_g,
    servingSodiumMg: row.serving_sodium_mg,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    sodiumMg: row.sodium_mg,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}
