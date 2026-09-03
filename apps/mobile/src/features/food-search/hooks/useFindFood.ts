import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MealType } from '@/features/diary/types/foodTypes';

import {
  FoodSearchError,
  foodSearchService as defaultFoodSearchService,
  type FoodSearchService,
} from '../services/foodSearchService';
import type {
  FoodSearchMode,
  FoodSearchResult,
  ProviderLookupSource,
} from '../types/foodSearchTypes';
import {
  isValidBarcode,
  isValidFdcId,
  isValidFoodSearchQuery,
  isValidProviderFoodId,
  normalizeBarcode,
  normalizeFdcId,
  normalizeFoodSearchQuery,
  normalizeProviderFoodId,
} from '../utils/foodSearchValidation';
import {
  getCorrectedQuery,
  normalizeSearchText,
  rankFoodResults,
} from '../utils/foodSearchSuggestions';

type FindFoodStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

type SearchCacheEntry = {
  foods: FoodSearchResult[];
  cachedAt: number;
};

export type UseFindFoodResult = {
  mode: FoodSearchMode;
  query: string;
  barcode: string;
  provider: ProviderLookupSource;
  externalId: string;
  quantity: string;
  mealType: MealType;
  results: FoodSearchResult[];
  recentFoods: FoodSearchResult[];
  autocompleteSuggestions: string[];
  correctedQuery: string | null;
  selectedFood: FoodSearchResult | null;
  status: FindFoodStatus;
  errorMessage: string | null;
  addToDiaryMessage: string | null;
  isLoading: boolean;
  setMode: (mode: FoodSearchMode) => void;
  setProvider: (provider: ProviderLookupSource) => void;
  setQuery: (value: string) => void;
  setBarcode: (value: string) => void;
  setExternalId: (value: string) => void;
  setQuantity: (value: string) => void;
  setMealType: (value: MealType) => void;
  search: () => Promise<void>;
  lookupBarcode: () => Promise<void>;
  lookupProviderId: () => Promise<void>;
  selectFood: (food: FoodSearchResult) => void;
  clearSelection: () => void;
  showAddToDiaryPlaceholder: () => void;
};

export function useFindFood(
  service: FoodSearchService = defaultFoodSearchService,
  userId?: string,
  initialMode: FoodSearchMode = 'search',
): UseFindFoodResult {
  const [mode, setMode] = useState<FoodSearchMode>(initialMode);
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [provider, setProviderState] = useState<ProviderLookupSource>('usda');
  const [externalId, setExternalId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodSearchResult[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [status, setStatus] = useState<FindFoodStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<FoodSearchMode | null>(null);
  const activeSubmissionRef = useRef<FoodSearchMode | null>(null);
  const [addToDiaryMessage, setAddToDiaryMessage] = useState<string | null>(null);
  const queryRef = useRef('');
  const resultsRef = useRef<FoodSearchResult[]>([]);
  const searchCacheRef = useRef(new Map<string, SearchCacheEntry>());

  const isLoading = activeSubmission !== null;

  const searchProviderWithCache = useCallback(
    async (queryKey: string): Promise<FoodSearchResult[]> => {
      const cached = searchCacheRef.current.get(queryKey);

      if (cached && Date.now() - cached.cachedAt < SEARCH_CACHE_TTL_MS) {
        return cached.foods;
      }

      const foods = await service.searchFoods(queryKey);
      searchCacheRef.current.set(queryKey, { cachedAt: Date.now(), foods });
      return foods;
    },
    [service],
  );

  const actions = useMemo(
    () => ({
      async search() {
        if (activeSubmissionRef.current) {
          return;
        }

        const normalizedQuery = normalizeFoodSearchQuery(query);

        if (!isValidFoodSearchQuery(normalizedQuery)) {
          setErrorMessage('Enter at least two characters to search foods.');
          setStatus('error');
          return;
        }

        const corrected = getCorrectedQuery(normalizedQuery);
        setCorrectedQuery(corrected);
        setAutocompleteSuggestions([]);
        beginSubmission('search');
        setStatus(resultsRef.current.length > 0 ? 'success' : 'loading');
        setErrorMessage(null);
        setAddToDiaryMessage(null);

        try {
          const foods = await searchProviderWithCache(normalizedQuery);
          const correctedFoods =
            corrected && corrected !== normalizedQuery
              ? await searchProviderWithCache(corrected)
              : [];
          const rankedFoods = rankFoodResults({
            providerResults: [...foods, ...correctedFoods],
            query: corrected ?? normalizedQuery,
            recentResults: recentFoods,
          });

          setResults(rankedFoods);
          setSelectedFood(null);
          setStatus(rankedFoods.length > 0 ? 'success' : 'empty');
          if (rankedFoods.length === 0) {
            setErrorMessage(
              corrected
                ? `No foods found for "${normalizedQuery}". Did you mean "${corrected}"?`
                : `No foods found for "${normalizedQuery}".`,
            );
          }
        } catch (error) {
          setResults([]);
          setStatus('error');
          setErrorMessage(getErrorMessage(error, 'Unable to search foods. Please try again.'));
        } finally {
          endSubmission();
        }
      },

      async lookupBarcode() {
        if (activeSubmissionRef.current) {
          return;
        }

        const normalizedBarcode = normalizeBarcode(barcode);

        if (!isValidBarcode(normalizedBarcode)) {
          setErrorMessage('Enter a valid UPC or EAN barcode.');
          setStatus('error');
          return;
        }

        beginSubmission('barcode');
        setStatus('loading');
        setErrorMessage(null);
        setAddToDiaryMessage(null);

        try {
          const food = await service.lookupBarcode(normalizedBarcode);

          setResults([food]);
          setSelectedFood(food);
          setStatus('success');
        } catch (error) {
          setStatus('error');
          setErrorMessage(getErrorMessage(error, "We couldn't find a product with that barcode."));
        } finally {
          endSubmission();
        }
      },

      async lookupProviderId() {
        if (activeSubmissionRef.current) {
          return;
        }

        const normalizedExternalId =
          provider === 'fatsecret'
            ? normalizeProviderFoodId(externalId)
            : normalizeFdcId(externalId);

        if (
          provider === 'fatsecret'
            ? !isValidProviderFoodId(normalizedExternalId)
            : !isValidFdcId(normalizedExternalId)
        ) {
          setErrorMessage(
            provider === 'fatsecret'
              ? 'Enter a valid FatSecret Food ID.'
              : 'Enter a valid USDA FDC ID.',
          );
          setStatus('error');
          return;
        }

        beginSubmission('provider-id');
        setStatus('loading');
        setErrorMessage(null);
        setAddToDiaryMessage(null);

        try {
          const food = await service.lookupProviderId({
            externalId: normalizedExternalId,
            provider,
          });

          setResults([food]);
          setSelectedFood(food);
          setStatus('success');
        } catch (error) {
          setStatus('error');
          setErrorMessage(
            getErrorMessage(
              error,
              provider === 'fatsecret'
                ? "We couldn't find a FatSecret food with that Food ID."
                : "We couldn't find a USDA food with that FDC ID.",
            ),
          );
        } finally {
          endSubmission();
        }
      },
    }),
    [barcode, externalId, provider, query, recentFoods, searchProviderWithCache, service],
  );

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    if (!userId || mode !== 'search') {
      return;
    }

    let cancelled = false;

    void service
      .fetchRecentFoods(userId)
      .then((foods) => {
        if (!cancelled) {
          setRecentFoods(foods);
          if (!normalizeSearchText(queryRef.current)) {
            setResults(foods);
            setStatus(foods.length > 0 ? 'success' : 'idle');
          }
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [mode, service, userId]);

  useEffect(() => {
    if (mode !== 'search') {
      return;
    }

    const normalizedQuery = normalizeFoodSearchQuery(query);

    if (normalizedQuery.length < 3) {
      return;
    }

    let cancelled = false;
    const timeout = setTimeout(() => {
      void service
        .autocompleteFoods(normalizedQuery)
        .then((suggestions) => {
          if (!cancelled) {
            setAutocompleteSuggestions(suggestions);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAutocompleteSuggestions([]);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [mode, query, service]);

  useEffect(() => {
    if (mode !== 'search') {
      return;
    }

    const normalizedQuery = normalizeFoodSearchQuery(query);

    if (!normalizedQuery) {
      return;
    }

    if (normalizedQuery.length < 2) {
      return;
    }

    const timeout = setTimeout(() => {
      void actions.search();
    }, 400);

    return () => clearTimeout(timeout);
  }, [actions, mode, query]);

  const setSearchQuery = useCallback(
    (value: string) => {
      queryRef.current = value;
      setQuery(value);

      if (!normalizeSearchText(value)) {
        setCorrectedQuery(null);
        setAutocompleteSuggestions([]);
        setResults(recentFoods);
        setStatus(recentFoods.length > 0 ? 'success' : 'idle');
      } else if (normalizeFoodSearchQuery(value).length < 3) {
        setAutocompleteSuggestions([]);
      }
    },
    [recentFoods],
  );

  function beginSubmission(submissionMode: FoodSearchMode) {
    activeSubmissionRef.current = submissionMode;
    setActiveSubmission(submissionMode);
  }

  function endSubmission() {
    activeSubmissionRef.current = null;
    setActiveSubmission(null);
  }

  return {
    mode,
    query,
    barcode,
    provider,
    externalId,
    quantity,
    mealType,
    results,
    recentFoods,
    autocompleteSuggestions,
    correctedQuery,
    selectedFood,
    status,
    errorMessage,
    addToDiaryMessage,
    isLoading,
    setMode(nextMode) {
      setMode(nextMode);
      if (nextMode === 'provider-id') {
        setProviderState('usda');
      }
      setErrorMessage(null);
      setAddToDiaryMessage(null);
    },
    setProvider(nextProvider) {
      setProviderState(nextProvider);
      setExternalId('');
      setErrorMessage(null);
      setStatus('idle');
    },
    setQuery: setSearchQuery,
    setBarcode,
    setExternalId,
    setQuantity,
    setMealType,
    search: actions.search,
    lookupBarcode: actions.lookupBarcode,
    lookupProviderId: actions.lookupProviderId,
    selectFood(food) {
      setSelectedFood(food);
      setAddToDiaryMessage(null);
    },
    clearSelection() {
      setSelectedFood(null);
      setAddToDiaryMessage(null);
    },
    showAddToDiaryPlaceholder() {
      setAddToDiaryMessage(
        'Food lookup is ready. Adding selected foods to the diary will be completed in the next food diary task.',
      );
    },
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof FoodSearchError || error instanceof Error ? error.message : fallback;
}
