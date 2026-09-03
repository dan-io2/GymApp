import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useFindFood } from '../useFindFood';
import type { FoodSearchService } from '../../services/foodSearchService';
import type { FoodSearchResult } from '../../types/foodSearchTypes';

describe('useFindFood', () => {
  it('searches foods and exposes normalized results', async () => {
    const food = createFoodResult();
    const service = createServiceMock({
      searchFoods: jest.fn().mockResolvedValue([food]),
    });
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setQuery(' chicken   breast ');
    });

    await act(async () => {
      await result.current.search();
    });

    expect(service.searchFoods).toHaveBeenCalledWith('chicken breast');
    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([food]);
  });

  it('searches a typed restaurant alias without an autocomplete selection', async () => {
    const service = createServiceMock({ searchFoods: jest.fn().mockResolvedValue([]) });
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setQuery('In N Out');
    });

    await act(async () => {
      await result.current.search();
    });

    expect(service.searchFoods).toHaveBeenCalledWith('in-n-out');
  });

  it('validates barcode input before calling the provider service', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setBarcode('1234567');
    });

    await act(async () => {
      await result.current.lookupBarcode();
    });

    expect(service.lookupBarcode).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Enter a valid UPC or EAN barcode.');
  });

  it('looks up barcodes and selects the returned food', async () => {
    const food = createFoodResult({
      barcode: '012345678905',
      externalId: '012345678905',
      source: 'open_food_facts',
      sourceLabel: 'Open Food Facts',
    });
    const service = createServiceMock({
      lookupBarcode: jest.fn().mockResolvedValue(food),
    });
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setBarcode('012345678905');
    });

    await act(async () => {
      await result.current.lookupBarcode();
    });

    expect(service.lookupBarcode).toHaveBeenCalledWith('012345678905');
    expect(result.current.selectedFood).toEqual(food);
  });

  it('looks up USDA provider ids after client validation', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setExternalId('2646170');
    });

    await act(async () => {
      await result.current.lookupProviderId();
    });

    expect(service.lookupProviderId).toHaveBeenCalledWith({
      externalId: '2646170',
      provider: 'usda',
    });
  });

  it('looks up FatSecret provider ids after client validation', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setProvider('fatsecret');
      result.current.setExternalId('12345');
    });

    await act(async () => {
      await result.current.lookupProviderId();
    });

    expect(service.lookupProviderId).toHaveBeenCalledWith({
      externalId: '12345',
      provider: 'fatsecret',
    });
  });

  it('prevents duplicate submissions while a lookup is already active', async () => {
    const deferred = createDeferred<FoodSearchResult[]>();
    const service = createServiceMock({
      searchFoods: jest.fn().mockReturnValue(deferred.promise),
    });
    const { result } = renderHook(() => useFindFood(service));

    act(() => {
      result.current.setQuery('oats');
    });

    void act(() => {
      void result.current.search();
      void result.current.search();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    expect(service.searchFoods).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve([createFoodResult({ name: 'Oats' })]);
      await deferred.promise;
    });
  });

  it('shows the diary placeholder without saving provider data locally', () => {
    const { result } = renderHook(() => useFindFood(createServiceMock()));

    act(() => {
      result.current.showAddToDiaryPlaceholder();
    });

    expect(result.current.addToDiaryMessage).toContain('next food diary task');
  });
});

function createServiceMock(overrides: Partial<FoodSearchService> = {}): FoodSearchService {
  return {
    autocompleteFoods: jest.fn().mockResolvedValue([]),
    fetchRecentFoods: jest.fn().mockResolvedValue([]),
    lookupBarcode: jest.fn().mockResolvedValue(createFoodResult()),
    lookupProviderId: jest.fn().mockResolvedValue(createFoodResult()),
    searchFoods: jest.fn().mockResolvedValue([createFoodResult()]),
    ...overrides,
  };
}

function createFoodResult(overrides: Partial<FoodSearchResult> = {}): FoodSearchResult {
  return {
    id: null,
    externalId: '2646170',
    source: 'usda',
    sourceLabel: 'USDA FoodData Central',
    barcode: null,
    name: 'Chicken Breast',
    brand: null,
    servingSize: 100,
    servingUnit: 'g',
    servingDescription: null,
    servingsPerContainer: null,
    servingBasis: 'per_100g',
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    fiberG: null,
    sugarG: null,
    sodiumMg: 74,
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return {
    promise,
    resolve,
  };
}
