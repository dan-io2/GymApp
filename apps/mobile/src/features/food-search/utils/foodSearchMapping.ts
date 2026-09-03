import type { Food } from '@/features/diary/types/foodTypes';

import type { FoodSearchResult } from '../types/foodSearchTypes';

export function mapFoodSearchResultToFood(result: FoodSearchResult): Food {
  return {
    id: result.id,
    externalId: result.externalId,
    source: result.source,
    barcode: result.barcode,
    name: result.name,
    brand: result.brand,
    servingSize: result.servingSize,
    servingUnit: result.servingUnit,
    servingDescription: result.servingDescription,
    servingsPerContainer: result.servingsPerContainer,
    servingBasis: result.servingBasis,
    servingCalories: result.calories,
    servingProteinG: result.proteinG,
    servingCarbsG: result.carbsG,
    servingFatG: result.fatG,
    servingFiberG: result.fiberG,
    servingSugarG: result.sugarG,
    servingSodiumMg: result.sodiumMg,
    calories: result.calories,
    proteinG: result.proteinG,
    carbsG: result.carbsG,
    fatG: result.fatG,
    fiberG: result.fiberG,
    sugarG: result.sugarG,
    sodiumMg: result.sodiumMg,
    servingOptions: result.servingOptions,
    createdBy: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}
