import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

import type {
  FoodLookupResponse,
  FoodProviderErrorCode,
  FoodSearchResponse,
  FoodSearchResult,
  ProviderLookupSource,
} from '../types/foodSearchTypes';

export class FoodSearchError extends Error {
  constructor(
    message: string,
    readonly code?: FoodProviderErrorCode | string,
  ) {
    super(message);
    this.name = 'FoodSearchError';
  }
}

export type FoodSearchService = {
  fetchRecentFoods: (userId: string) => Promise<FoodSearchResult[]>;
  autocompleteFoods: (query: string) => Promise<string[]>;
  searchFoods: (query: string) => Promise<FoodSearchResult[]>;
  lookupBarcode: (barcode: string) => Promise<FoodSearchResult>;
  lookupProviderId: (input: {
    provider: ProviderLookupSource;
    externalId: string;
  }) => Promise<FoodSearchResult>;
};

export function createFoodSearchService(client: SupabaseClient<Database>): FoodSearchService {
  return {
    async fetchRecentFoods(userId) {
      const { data, error } = await client
        .from('food_logs')
        .select(
          'id, food_id, food_name, brand, serving_size, serving_unit, serving_calories, serving_protein_g, serving_carbs_g, serving_fat_g, serving_fiber_g, serving_sugar_g, serving_sodium_mg, logged_at',
        )
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new FoodSearchError('Unable to load recent foods.', error.code);
      }

      return dedupeRecentFoods(
        (data ?? []).map((row) => ({
          id: row.food_id,
          externalId: row.food_id ?? row.id,
          source: 'internal',
          sourceLabel: 'Recent',
          barcode: null,
          name: row.food_name,
          brand: row.brand,
          servingSize: row.serving_size,
          servingUnit: row.serving_unit,
          servingDescription:
            row.serving_size && row.serving_unit ? `${row.serving_size} ${row.serving_unit}` : null,
          servingsPerContainer: null,
          servingBasis: row.serving_size === null ? 'unknown' : 'per_serving',
          calories: row.serving_calories,
          proteinG: row.serving_protein_g,
          carbsG: row.serving_carbs_g,
          fatG: row.serving_fat_g,
          fiberG: row.serving_fiber_g,
          sugarG: row.serving_sugar_g,
          sodiumMg: row.serving_sodium_mg,
        })),
      );
    },

    async searchFoods(query) {
      const { data, error } = await client.functions.invoke<FoodSearchResponse>('search-food', {
        body: { query },
      });

      if (error) {
        throw await createFoodSearchError(error, 'Unable to search foods. Please try again.');
      }

      return data?.foods ?? [];
    },

    async autocompleteFoods(query) {
      const { data, error } = await client.functions.invoke<{ suggestions: string[] }>(
        'autocomplete-food',
        {
          body: { query },
        },
      );

      if (error) {
        throw await createFoodSearchError(error, 'Unable to autocomplete foods.');
      }

      return data?.suggestions ?? [];
    },

    async lookupBarcode(barcode) {
      const { data, error } = await client.functions.invoke<FoodLookupResponse>('lookup-barcode', {
        body: { barcode },
      });

      if (error) {
        throw await createFoodSearchError(error, "We couldn't find a product with that barcode.");
      }

      if (!data?.food) {
        throw new FoodSearchError(
          "We couldn't find a product with that barcode.",
          'PRODUCT_NOT_FOUND',
        );
      }

      return data.food;
    },

    async lookupProviderId({ externalId, provider }) {
      const { data, error } = await client.functions.invoke<FoodLookupResponse>('lookup-food-id', {
        body: { externalId, provider },
      });

      const fallbackMessage =
        provider === 'fatsecret'
          ? "We couldn't find a FatSecret food with that Food ID."
          : "We couldn't find a USDA food with that FDC ID.";

      if (error) {
        throw await createFoodSearchError(error, fallbackMessage);
      }

      if (!data?.food) {
        throw new FoodSearchError(fallbackMessage, 'FOOD_NOT_FOUND');
      }

      return data.food;
    },
  };
}

function dedupeRecentFoods(foods: FoodSearchResult[]): FoodSearchResult[] {
  const seen = new Set<string>();

  return foods.filter((food) => {
    const key = `${food.name}:${food.brand ?? ''}:${food.servingSize ?? ''}:${food.servingUnit ?? ''}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export const foodSearchService = createFoodSearchService(supabase);

async function createFoodSearchError(
  error: unknown,
  fallbackMessage: string,
): Promise<FoodSearchError> {
  const context = error as {
    context?: Response;
    message?: string;
  };
  const providerBody =
    context.context instanceof Response
      ? await context.context
          .clone()
          .json()
          .catch(
            () =>
              null as null | {
                error?: {
                  code?: FoodProviderErrorCode | string;
                  message?: string;
                };
              },
          )
      : null;

  if (__DEV__) {
    console.info('[GymApp food provider]', {
      code: providerBody?.error?.code ?? null,
      message: providerBody?.error?.message ?? context.message ?? fallbackMessage,
      status: context.context instanceof Response ? context.context.status : null,
    });
  }

  return new FoodSearchError(
    providerBody?.error?.message ?? context.message ?? fallbackMessage,
    providerBody?.error?.code,
  );
}
