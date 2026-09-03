import { useEffect, useRef, useState } from 'react';

import {
  FoodSearchError,
  foodSearchService as defaultFoodSearchService,
  type FoodSearchService,
} from '@/features/food-search/services/foodSearchService';
import type { FoodSearchResult } from '@/features/food-search/types/foodSearchTypes';
import {
  isValidBarcode,
  normalizeBarcode,
} from '@/features/food-search/utils/foodSearchValidation';

export type BarcodeScannerStatus =
  'ready' | 'detected' | 'looking_up' | 'success' | 'not_found' | 'error';

export type BarcodeScanEvent = {
  data: string;
  type: string;
};

export type UseBarcodeScannerResult = {
  barcode: string | null;
  errorMessage: string | null;
  food: FoodSearchResult | null;
  isScanningEnabled: boolean;
  status: BarcodeScannerStatus;
  handleBarcodeScanned: (event: BarcodeScanEvent) => void;
  resetScanner: () => void;
};

export type UseBarcodeScannerOptions = {
  isActive?: boolean;
  onFirstDetection?: (barcode: string) => void;
};

export function useBarcodeScanner(
  service: FoodSearchService = defaultFoodSearchService,
  options: UseBarcodeScannerOptions = {},
): UseBarcodeScannerResult {
  const { isActive = true, onFirstDetection } = options;
  const [barcode, setBarcode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [food, setFood] = useState<FoodSearchResult | null>(null);
  const [status, setStatus] = useState<BarcodeScannerStatus>('ready');
  const isMountedRef = useRef(true);
  const scanLockedRef = useRef(false);

  const isScanningEnabled = isActive && status === 'ready';

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function handleBarcodeScanned(event: BarcodeScanEvent) {
    if (!isActive || scanLockedRef.current || status !== 'ready') {
      return;
    }

    const nextBarcode = normalizeBarcode(event.data);
    scanLockedRef.current = true;
    setBarcode(nextBarcode);
    setErrorMessage(null);
    setFood(null);
    setStatus('detected');

    if (!isValidBarcode(nextBarcode)) {
      setStatus('error');
      setErrorMessage('The scanned code is not a supported UPC or EAN barcode.');
      return;
    }

    onFirstDetection?.(nextBarcode);
    setStatus('looking_up');

    void service
      .lookupBarcode(nextBarcode)
      .then((lookupFood) => {
        if (!isMountedRef.current) {
          return;
        }

        setFood(lookupFood);
        setStatus('success');
      })
      .catch((error) => {
        if (!isMountedRef.current) {
          return;
        }

        const message = getErrorMessage(error, "We couldn't find a product with that barcode.");
        setStatus(
          error instanceof FoodSearchError && error.code === 'PRODUCT_NOT_FOUND'
            ? 'not_found'
            : 'error',
        );
        setErrorMessage(message);
      });
  }

  function resetScanner() {
    scanLockedRef.current = false;
    setBarcode(null);
    setErrorMessage(null);
    setFood(null);
    setStatus('ready');
  }

  return {
    barcode,
    errorMessage,
    food,
    handleBarcodeScanned,
    isScanningEnabled,
    resetScanner,
    status,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof FoodSearchError || error instanceof Error ? error.message : fallback;
}
