export type ProviderSource = 'usda' | 'open_food_facts' | 'fatsecret';

export type ServingBasis = 'per_100g' | 'per_100ml' | 'per_serving' | 'unknown';

export type NormalizedServingOption = {
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

export type NormalizedFoodResult = {
  id: null;
  externalId: string;
  source: ProviderSource;
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
  servingOptions?: NormalizedServingOption[];
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

export type FoodProviderErrorBody = {
  error: {
    code: FoodProviderErrorCode;
    message: string;
    provider: ProviderSource;
    status: number;
  };
};

export type FoodSearchResponse = {
  foods: NormalizedFoodResult[];
  diagnostics?: FoodProviderDiagnostic[];
};

export type FoodLookupResponse = {
  food: NormalizedFoodResult;
};

export type FoodAutocompleteResponse = {
  suggestions: string[];
  diagnostics?: FoodProviderDiagnostic[];
};

export type FoodProviderDiagnostic = {
  code: FoodProviderErrorCode;
  message: string;
  provider: ProviderSource;
  status: number;
};
