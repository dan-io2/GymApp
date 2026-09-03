import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { BarcodeScannerScreen } from '../BarcodeScannerScreen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockLookupBarcode = jest.fn();
const mockNotificationAsync = jest.fn();
const mockUseCameraPermissions = jest.fn();

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = jest.requireActual('react') as typeof import('react');

    React.useEffect(() => callback(), [callback]);
  },
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: jest.fn(),
  }),
}));

jest.mock('expo-camera', () => ({
  CameraView: ({
    onBarcodeScanned,
  }: {
    children?: ReactNode;
    onBarcodeScanned?: (event: { data: string; type: string }) => void;
  }) => {
    const React = jest.requireActual('react') as typeof import('react');
    const { View } = jest.requireActual('react-native') as typeof import('react-native');

    return React.createElement(View, {
      onBarcodeScanned,
      testID: 'camera-view',
    } as never);
  },
  useCameraPermissions: () => mockUseCameraPermissions(),
}));

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: {
    Success: 'success',
  },
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
}));

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-id',
      email: 'test@example.com',
    },
  }),
}));

jest.mock('@/features/food-search/services/foodSearchService', () => {
  class FoodSearchError extends Error {
    code?: string;

    constructor(message: string, errorCode?: string) {
      super(message);
      this.code = errorCode;
      this.name = 'FoodSearchError';
    }
  }

  return {
    FoodSearchError,
    foodSearchService: {
      autocompleteFoods: jest.fn(),
      fetchRecentFoods: jest.fn().mockResolvedValue([]),
      lookupBarcode: (...args: unknown[]) => mockLookupBarcode(...args),
      lookupProviderId: jest.fn(),
      searchFoods: jest.fn(),
    },
  };
});

describe('BarcodeScannerScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockLookupBarcode.mockReset();
    mockLookupBarcode.mockReturnValue(new Promise(() => undefined));
    mockNotificationAsync.mockReset();
    mockNotificationAsync.mockResolvedValue(undefined);
    mockPush.mockClear();
    mockUseCameraPermissions.mockReset();
  });

  it('explains denied camera permission and keeps manual barcode fallback available', () => {
    mockUseCameraPermissions.mockReturnValue([
      {
        canAskAgain: false,
        expires: 'never',
        granted: false,
        status: 'denied',
      },
      jest.fn(),
    ]);

    render(<BarcodeScannerScreen />);

    expect(screen.getByText('Camera access is required to scan barcodes.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Enter Barcode Manually' }));

    expect(mockPush).toHaveBeenCalledWith('/find-food?mode=barcode');
  });

  it('renders the scanner when camera permission is granted', () => {
    mockUseCameraPermissions.mockReturnValue([
      {
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: 'granted',
      },
      jest.fn(),
    ]);

    render(<BarcodeScannerScreen />);

    expect(screen.getByTestId('camera-view')).toBeTruthy();
    expect(screen.getByTestId('barcode-scan-overlay')).toBeTruthy();
    expect(screen.getByText('Align the barcode inside the frame.')).toBeTruthy();
    expect(screen.getByTestId('barcode-scan-line')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Turn flash on' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enter Barcode Manually' })).toBeTruthy();
  });

  it('shows detection feedback, pauses the scan line during lookup, and keeps duplicate protection', async () => {
    mockUseCameraPermissions.mockReturnValue([
      {
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: 'granted',
      },
      jest.fn(),
    ]);

    render(<BarcodeScannerScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('barcode-scan-line')).toBeTruthy();
    });

    fireEvent(screen.getByTestId('camera-view'), 'barcodeScanned', {
      data: '0017400106959',
      type: 'ean13',
    });
    fireEvent(screen.getByTestId('camera-view'), 'barcodeScanned', {
      data: '012345678905',
      type: 'upc_a',
    });

    expect(mockLookupBarcode).toHaveBeenCalledTimes(1);
    expect(mockLookupBarcode).toHaveBeenCalledWith('0017400106959');
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Barcode detected')).toBeTruthy();
      expect(screen.getByText('0017400106959')).toBeTruthy();
      expect(screen.getByText('Finding product...')).toBeTruthy();
      expect(screen.queryByTestId('barcode-scan-line')).toBeNull();
    });
  });

  it('toggles the torch control label without removing scanner controls', () => {
    mockUseCameraPermissions.mockReturnValue([
      {
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: 'granted',
      },
      jest.fn(),
    ]);

    render(<BarcodeScannerScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Turn flash on' }));

    expect(screen.getByRole('button', { name: 'Turn flash off' })).toBeTruthy();
    expect(screen.getByText('Flash On')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enter Barcode Manually' })).toBeTruthy();
  });

  it('scan again clears a recoverable lookup error and re-enables scanning', async () => {
    mockLookupBarcode.mockRejectedValueOnce(new Error("We couldn't find a product."));
    mockUseCameraPermissions.mockReturnValue([
      {
        canAskAgain: true,
        expires: 'never',
        granted: true,
        status: 'granted',
      },
      jest.fn(),
    ]);

    render(<BarcodeScannerScreen />);

    fireEvent(screen.getByTestId('camera-view'), 'barcodeScanned', {
      data: '0017400106959',
      type: 'ean13',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Scan Again' })).toBeTruthy();
    });

    fireEvent.press(screen.getByRole('button', { name: 'Scan Again' }));

    expect(screen.queryByText('Barcode detected')).toBeNull();
    expect(screen.queryByText('0017400106959')).toBeNull();
    expect(screen.getByTestId('barcode-scan-line')).toBeTruthy();

    mockLookupBarcode.mockReturnValueOnce(new Promise(() => undefined));

    fireEvent(screen.getByTestId('camera-view'), 'barcodeScanned', {
      data: '012345678905',
      type: 'upc_a',
    });

    expect(mockLookupBarcode).toHaveBeenCalledTimes(2);
    expect(mockLookupBarcode).toHaveBeenLastCalledWith('012345678905');
  });
});
