import type { TablesInsert } from '@/types/database';
import type { FoodLog } from '@/features/diary/types/foodTypes';

export function normalizeSavedMealName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function isValidSavedMealName(name: string): boolean {
  const normalizedName = normalizeSavedMealName(name);

  return normalizedName.length > 0 && normalizedName.length <= 80;
}

export function createSavedMealItemInsert(
  log: FoodLog,
  savedMealId: string,
  sortOrder: number,
): TablesInsert<'saved_meal_items'> {
  return {
    saved_meal_id: savedMealId,
    food_id: log.foodId,
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
    sort_order: sortOrder,
  };
}
