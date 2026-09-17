import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database, TablesInsert } from '@/types/database';
import type { FoodSearchResult } from '@/features/food-search/types/foodSearchTypes';

export type ManualFoodInput = {
  name: string;
  servingAmount: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export class ManualFoodError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ManualFoodError';
  }
}

export function createManualFoodService(client: SupabaseClient<Database>) {
  return {
    async create(userId: string, input: ManualFoodInput): Promise<FoodSearchResult> {
      const valid = validateManualFood(input);
      const externalId = `manual:${userId}:${createIdentity()}`;
      const insert: TablesInsert<'foods'> = {
        source: 'user',
        created_by: userId,
        external_id: externalId,
        name: valid.name,
        serving_size: valid.servingAmount,
        serving_unit: valid.servingUnit,
        calories: valid.calories,
        protein_g: valid.proteinG,
        carbs_g: valid.carbsG,
        fat_g: valid.fatG,
      };
      const { data, error } = await client.from('foods').insert(insert).select().single();

      if (error || !data) {
        throw new ManualFoodError('Unable to save this custom food.', error?.code);
      }

      return {
        id: data.id,
        externalId: data.external_id ?? data.id,
        source: 'user',
        sourceLabel: 'Custom Food',
        barcode: null,
        name: data.name,
        brand: null,
        servingSize: data.serving_size,
        servingUnit: data.serving_unit,
        servingDescription: `${data.serving_size} ${data.serving_unit}`,
        servingsPerContainer: null,
        servingBasis: 'per_serving',
        calories: data.calories,
        proteinG: data.protein_g,
        carbsG: data.carbs_g,
        fatG: data.fat_g,
        fiberG: null,
        sugarG: null,
        sodiumMg: null,
      };
    },
  };
}

export const manualFoodService = createManualFoodService(supabase);

export function validateManualFood(input: ManualFoodInput): ManualFoodInput {
  const name = input.name.trim();
  const servingUnit = input.servingUnit.trim();
  const numericValues = [
    input.servingAmount,
    input.calories,
    input.proteinG,
    input.carbsG,
    input.fatG,
  ];

  if (!name || name.length > 160) {
    throw new ManualFoodError('Enter a food name up to 160 characters.');
  }
  if (!servingUnit || servingUnit.length > 40 || input.servingAmount <= 0) {
    throw new ManualFoodError('Enter a valid serving amount and unit.');
  }
  if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new ManualFoodError('Nutrition values must be valid non-negative numbers.');
  }

  return { ...input, name, servingUnit };
}

function createIdentity(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
