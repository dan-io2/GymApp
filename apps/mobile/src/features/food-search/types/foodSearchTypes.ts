import type { FoodSource } from '@/features/diary/types/foodTypes';

export type FoodSearchMode = 'search' | 'barcode' | 'provider-id';
export type ProviderLookupSource = 'usda' | 'fatsecret';
export type ServingBasis = 'per_100g' | 'per_100ml' | 'per_serving' | 'unknown';

export type FoodServingOption = {
  id: string;
  servingDescription: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  servingBasis: ServingBasis;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  isDefault: boolean;
};

export type FoodSearchResult = {
  id: string | null;
  externalId: string;
  source: FoodSource;
  sourceLabel: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  servingDescription: string | null;
  servingsPerContainer: number | null;
  servingBasis: ServingBasis;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  servingOptions?: FoodServingOption[];
};

export type FoodProviderErrorCode =
  | 'INVALID_BARCODE'
  | 'INVALID_FDC_ID'
  | 'INVALID_QUERY'
  | 'MISSING_FATSECRET_CONFIG'
  | 'MISSING_USDA_API_KEY'
  | 'PRODUCT_NOT_FOUND'
  | 'FOOD_NOT_FOUND'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INVALID_PROVIDER_RESPONSE';

export type FoodSearchResponse = {
  foods: FoodSearchResult[];
};

export type FoodLookupResponse = {
  food: FoodSearchResult;
};
