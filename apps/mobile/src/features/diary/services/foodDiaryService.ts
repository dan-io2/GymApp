import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database, TablesInsert } from '@/types/database';

import type { Food, FoodLog, MealType } from '../types/foodTypes';
import {
  aggregateDailyNutrition,
  calculateFoodLogSnapshot,
  calculateFoodLogTotalsFromPortion,
  getLocalDayRange,
} from '../utils/foodDiaryUtils';

export class FoodDiaryError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'FoodDiaryError';
  }
}

export type FoodDiaryService = {
  fetchLogsForLocalDate: (userId: string, date: Date) => Promise<FoodLog[]>;
  addLog: (input: {
    userId: string;
    food: Food;
    mealType: MealType;
    itemQuantity?: number;
    portionAmount?: number;
    portionUnit?: string;
    quantity: number;
  }) => Promise<FoodLog>;
  updateLog: (input: {
    log: FoodLog;
    mealType: MealType;
    itemQuantity?: number;
    portionAmount?: number;
    portionUnit?: string;
    quantity: number;
  }) => Promise<FoodLog>;
  updateQuantity: (input: { log: FoodLog; quantity: number }) => Promise<FoodLog>;
  deleteLog: (logId: string) => Promise<void>;
  calculateTotals: typeof aggregateDailyNutrition;
};

export function createFoodDiaryService(client: SupabaseClient<Database>): FoodDiaryService {
  return {
    async fetchLogsForLocalDate(userId, date) {
      const { start, end } = getLocalDayRange(date);
      const { data, error } = await client
        .from('food_logs')
        .select(
          'id, user_id, food_id, meal_type, food_name, brand, quantity, item_quantity, portion_amount, portion_unit, serving_equivalent, serving_size, serving_unit, serving_calories, serving_protein_g, serving_carbs_g, serving_fat_g, serving_fiber_g, serving_sugar_g, serving_sodium_mg, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, logged_at, created_at',
        )
        .eq('user_id', userId)
        .gte('logged_at', start)
        .lt('logged_at', end)
        .order('logged_at', { ascending: true });

      if (error) {
        throw new FoodDiaryError('Unable to load your food diary. Please try again.', error.code);
      }

      return (data ?? []).map(mapFoodLog);
    },

    async addLog({ food, itemQuantity, mealType, portionAmount, portionUnit, quantity, userId }) {
      const snapshot = calculateFoodLogSnapshot({
        food,
        itemQuantity,
        mealType,
        portionAmount,
        portionUnit,
        quantity,
        userId,
      });
      const insert: TablesInsert<'food_logs'> = {
        user_id: snapshot.userId,
        food_id: snapshot.foodId,
        meal_type: snapshot.mealType,
        food_name: snapshot.foodName,
        brand: snapshot.brand,
        quantity: snapshot.quantity,
        item_quantity: snapshot.itemQuantity,
        portion_amount: snapshot.portionAmount,
        portion_unit: snapshot.portionUnit,
        serving_equivalent: snapshot.servingEquivalent,
        serving_size: snapshot.servingSize,
        serving_unit: snapshot.servingUnit,
        serving_calories: snapshot.servingCalories,
        serving_protein_g: snapshot.servingProteinG,
        serving_carbs_g: snapshot.servingCarbsG,
        serving_fat_g: snapshot.servingFatG,
        serving_fiber_g: snapshot.servingFiberG,
        serving_sugar_g: snapshot.servingSugarG,
        serving_sodium_mg: snapshot.servingSodiumMg,
        calories: snapshot.calories,
        protein_g: snapshot.proteinG,
        carbs_g: snapshot.carbsG,
        fat_g: snapshot.fatG,
        fiber_g: snapshot.fiberG,
        sugar_g: snapshot.sugarG,
        sodium_mg: snapshot.sodiumMg,
        logged_at: snapshot.loggedAt,
      };
      const { data, error } = await client.from('food_logs').insert(insert).select().single();

      if (error) {
        throw new FoodDiaryError('Unable to add this food to your diary.', error.code);
      }

      return mapFoodLog(data);
    },

    async updateLog({ log, itemQuantity, mealType, portionAmount, portionUnit, quantity }) {
      const totals = calculateFoodLogTotalsFromPortion(
        log,
        portionAmount ?? quantity,
        portionUnit ?? 'serving',
        itemQuantity ?? log.itemQuantity,
      );
      const { data, error } = await client
        .from('food_logs')
        .update({
          meal_type: mealType,
          quantity: totals.quantity,
          item_quantity: totals.itemQuantity,
          portion_amount: totals.portionAmount,
          portion_unit: totals.portionUnit,
          serving_equivalent: totals.servingEquivalent,
          calories: totals.calories,
          protein_g: totals.proteinG,
          carbs_g: totals.carbsG,
          fat_g: totals.fatG,
          fiber_g: totals.fiberG,
          sugar_g: totals.sugarG,
          sodium_mg: totals.sodiumMg,
        })
        .eq('id', log.id)
        .select()
        .single();

      if (error) {
        throw new FoodDiaryError('Unable to update this diary item.', error.code);
      }

      return mapFoodLog(data);
    },

    updateQuantity(input) {
      return this.updateLog({
        log: input.log,
        mealType: input.log.mealType,
        quantity: input.quantity,
      });
    },

    async deleteLog(logId) {
      const { error } = await client.from('food_logs').delete().eq('id', logId);

      if (error) {
        throw new FoodDiaryError('Unable to delete this diary item.', error.code);
      }
    },

    calculateTotals: aggregateDailyNutrition,
  };
}

export const foodDiaryService = createFoodDiaryService(supabase);

export function mapFoodLog(row: {
  id: string;
  user_id: string;
  food_id: string | null;
  meal_type: string;
  food_name: string;
  brand: string | null;
  quantity: number;
  item_quantity: number | null;
  portion_amount: number | null;
  portion_unit: string | null;
  serving_equivalent: number | null;
  serving_size: number | null;
  serving_unit: string | null;
  serving_calories: number;
  serving_protein_g: number;
  serving_carbs_g: number;
  serving_fat_g: number;
  serving_fiber_g: number | null;
  serving_sugar_g: number | null;
  serving_sodium_mg: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  logged_at: string;
  created_at: string;
}): FoodLog {
  return {
    id: row.id,
    userId: row.user_id,
    foodId: row.food_id,
    mealType:
      row.meal_type === 'breakfast' ||
      row.meal_type === 'lunch' ||
      row.meal_type === 'dinner' ||
      row.meal_type === 'snack'
        ? row.meal_type
        : 'snack',
    foodName: row.food_name,
    brand: row.brand,
    quantity: row.quantity,
    itemQuantity: row.item_quantity ?? 1,
    portionAmount: row.portion_amount ?? row.quantity,
    portionUnit: row.portion_unit ?? 'serving',
    servingEquivalent: row.serving_equivalent ?? row.quantity,
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
    loggedAt: row.logged_at,
    createdAt: row.created_at,
  };
}
