import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { FoodSearchService } from '@/features/food-search/services/foodSearchService';
import type { FoodSearchResult } from '@/features/food-search/types/foodSearchTypes';

import { useBarcodeScanner } from '../useBarcodeScanner';

describe('useBarcodeScanner', () => {
  it('passes camera barcode strings with leading zeroes to the existing lookup service', async () => {
    const deferred = createDeferred<FoodSearchResult>();
    const food = createFoodResult({
      barcode: '0017400106959',
      externalId: '0017400106959',
    });
    const service = createServiceMock({
      lookupBarcode: jest.fn().mockReturnValue(deferred.promise),
    });
    const { result } = renderHook(() => useBarcodeScanner(service));

    act(() => {
      result.current.handleBarcodeScanned({
        data: '0017400106959',
        type: 'ean13',
      });
    });

    await act(async () => {
      deferred.resolve(food);
      await deferred.promise;
    });

    expect(service.lookupBarcode).toHaveBeenCalledWith('0017400106959');
    expect(result.current.status).toBe('success');
    expect(result.current.food).toEqual(food);
  });

  it('locks scanning after the first valid barcode until the user scans again', async () => {
    const deferred = createDeferred<FoodSearchResult>();
    const secondDeferred = createDeferred<FoodSearchResult>();
    const service = createServiceMock({
      lookupBarcode: jest
        .fn()
        .mockReturnValueOnce(deferred.promise)
        .mockReturnValueOnce(secondDeferred.promise),
    });
    const { result } = renderHook(() => useBarcodeScanner(service));

    act(() => {
      result.current.handleBarcodeScanned({
        data: '012345678905',
        type: 'upc_a',
      });
      result.current.handleBarcodeScanned({
        data: '0017400106959',
        type: 'ean13',
      });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('looking_up');
    });

    expect(service.lookupBarcode).toHaveBeenCalledTimes(1);
    expect(service.lookupBarcode).toHaveBeenCalledWith('012345678905');

    await act(async () => {
      deferred.resolve(createFoodResult({ barcode: '012345678905', externalId: '012345678905' }));
      await deferred.promise;
    });

    act(() => {
      result.current.resetScanner();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    act(() => {
      result.current.handleBarcodeScanned({
        data: '0017400106959',
        type: 'ean13',
      });
    });

    expect(service.lookupBarcode).toHaveBeenCalledTimes(2);
    expect(service.lookupBarcode).toHaveBeenLastCalledWith('0017400106959');

    await act(async () => {
      secondDeferred.resolve(
        createFoodResult({ barcode: '0017400106959', externalId: '0017400106959' }),
      );
      await secondDeferred.promise;
    });
  });

  it('fires the first-detection callback once while duplicate protection is locked', async () => {
    const deferred = createDeferred<FoodSearchResult>();
    const onFirstDetection = jest.fn();
    const service = createServiceMock({
      lookupBarcode: jest.fn().mockReturnValue(deferred.promise),
    });
    const { result } = renderHook(() =>
      useBarcodeScanner(service, {
        onFirstDetection,
      }),
    );

    act(() => {
      result.current.handleBarcodeScanned({
        data: '012345678905',
        type: 'upc_a',
      });
      result.current.handleBarcodeScanned({
        data: '0017400106959',
        type: 'ean13',
      });
    });

    expect(onFirstDetection).toHaveBeenCalledTimes(1);
    expect(onFirstDetection).toHaveBeenCalledWith('012345678905');

    await act(async () => {
      deferred.resolve(createFoodResult());
      await deferred.promise;
    });
  });

  it('does not process camera callbacks while the scanner is inactive', () => {
    const service = createServiceMock();
    const { result } = renderHook(() =>
      useBarcodeScanner(service, {
        isActive: false,
      }),
    );

    act(() => {
      result.current.handleBarcodeScanned({
        data: '012345678905',
        type: 'upc_a',
      });
    });

    expect(service.lookupBarcode).not.toHaveBeenCalled();
    expect(result.current.status).toBe('ready');
    expect(result.current.isScanningEnabled).toBe(false);
  });

  it('rejects unsupported barcode data without calling the provider', () => {
    const service = createServiceMock();
    const { result } = renderHook(() => useBarcodeScanner(service));

    act(() => {
      result.current.handleBarcodeScanned({
        data: 'not-a-barcode',
        type: 'qr',
      });
    });

    expect(service.lookupBarcode).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe(
      'The scanned code is not a supported UPC or EAN barcode.',
    );
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
    externalId: '012345678905',
    source: 'open_food_facts',
    sourceLabel: 'Open Food Facts',
    barcode: '012345678905',
    name: 'Protein Chips',
    brand: 'Quest Nutrition',
    servingSize: 32,
    servingUnit: 'g',
    servingDescription: '32 g',
    servingsPerContainer: 8,
    servingBasis: 'per_serving',
    calories: 140,
    proteinG: 20,
    carbsG: 4,
    fatG: 4.5,
    fiberG: 1,
    sugarG: 1,
    sodiumMg: 320,
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
