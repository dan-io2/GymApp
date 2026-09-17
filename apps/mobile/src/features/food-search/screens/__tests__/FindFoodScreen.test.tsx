import { fireEvent, render, screen } from '@testing-library/react-native';

import { FindFoodScreen } from '../FindFoodScreen';
import type { UseFindFoodResult } from '../../hooks/useFindFood';
import type { FoodSearchResult } from '../../types/foodSearchTypes';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockFindFood: UseFindFoodResult = createFindFoodState();
const mockFoodLibrary = {
  addFavorite: jest.fn().mockResolvedValue(true),
  clearMessage: jest.fn(),
  createSavedMeal: jest.fn(),
  deleteFavorite: jest.fn().mockResolvedValue(true),
  deleteSavedMeal: jest.fn(),
  errorMessage: null as string | null,
  favorites: [],
  isLoading: false,
  load: jest.fn(),
  logAgain: jest.fn(),
  logSavedMeal: jest.fn(),
  message: null as string | null,
  removeSavedMealItem: jest.fn(),
  renameSavedMeal: jest.fn(),
  savedMeals: [],
  status: 'success',
};

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-id',
      email: 'test@example.com',
    },
  }),
}));

jest.mock('@/features/diary/components/AddFoodPanel', () => ({
  AddFoodPanel: ({ food }: { food: { name: string } }) => {
    const { Text } = jest.requireActual('react-native') as typeof import('react-native');

    return <Text>{`Add food form for ${food.name}`}</Text>;
  },
}));

jest.mock('../../hooks/useFindFood', () => ({
  useFindFood: () => mockFindFood,
}));

jest.mock('@/features/saved-meals/hooks/useFoodLibrary', () => ({
  useFoodLibrary: () => mockFoodLibrary,
}));

describe('FindFoodScreen', () => {
  beforeEach(() => {
    Object.assign(mockFindFood, createFindFoodState());
    Object.assign(mockFoodLibrary, {
      errorMessage: null,
      favorites: [],
      message: null,
      savedMeals: [],
    });
    mockBack.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockFoodLibrary.addFavorite.mockClear();
    mockFoodLibrary.deleteFavorite.mockClear();
  });

  it('renders search mode and starts a text search', () => {
    render(<FindFoodScreen />);

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'oats');
    fireEvent.press(screen.getAllByRole('button', { name: 'Search' })[1]);

    expect(mockFindFood.setQuery).toHaveBeenCalledWith('oats');
    expect(mockFindFood.search).toHaveBeenCalledTimes(1);
  });

  it('submits the current typed query when the keyboard Search action is pressed', () => {
    render(<FindFoodScreen />);

    fireEvent.changeText(screen.getByLabelText('Search foods'), 'in n out');
    fireEvent(screen.getByLabelText('Search foods'), 'submitEditing');

    expect(mockFindFood.setQuery).toHaveBeenCalledWith('in n out');
    expect(mockFindFood.search).toHaveBeenCalledTimes(1);
  });

  it('switches to manual barcode lookup without using camera scanning', () => {
    render(<FindFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Barcode' }));

    expect(mockFindFood.setMode).toHaveBeenCalledWith('barcode');
  });

  it('renders provider id lookup for USDA products', () => {
    Object.assign(mockFindFood, createFindFoodState({ mode: 'provider-id' }));

    render(<FindFoodScreen />);

    expect(screen.getByText('USDA FoodData Central')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Product or FDC ID'), '2646170');
    fireEvent.press(screen.getByRole('button', { name: 'Find Product' }));

    expect(mockFindFood.setExternalId).toHaveBeenCalledWith('2646170');
    expect(mockFindFood.lookupProviderId).toHaveBeenCalledTimes(1);
  });

  it('lets users select FatSecret provider id lookup', () => {
    Object.assign(mockFindFood, createFindFoodState({ mode: 'provider-id' }));

    render(<FindFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'FatSecret' }));

    expect(mockFindFood.setProvider).toHaveBeenCalledWith('fatsecret');
  });

  it('renders FatSecret autocomplete suggestions with attribution', () => {
    Object.assign(
      mockFindFood,
      createFindFoodState({
        autocompleteSuggestions: ['Chipotle Chicken'],
        query: 'chi',
      }),
    );

    render(<FindFoodScreen />);

    expect(screen.getByText('Chipotle Chicken')).toBeTruthy();
    expect(screen.getByText('Autocomplete powered by FatSecret')).toBeTruthy();
  });

  it('shows normalized source, barcode, and nutrient details for a selected result', () => {
    Object.assign(
      mockFindFood,
      createFindFoodState({
        selectedFood: createFoodResult({
          barcode: '012345678905',
          source: 'open_food_facts',
          sourceLabel: 'Open Food Facts',
        }),
      }),
    );

    render(<FindFoodScreen />);

    expect(screen.getByText('Open Food Facts')).toBeTruthy();
    expect(screen.getByText('Chicken Breast')).toBeTruthy();
    expect(screen.getByText('Barcode: 012345678905')).toBeTruthy();
    expect(screen.getByText('Protein')).toBeTruthy();
    expect(screen.getByText('31 g')).toBeTruthy();
  });

  it('shows provider errors and loading state', () => {
    Object.assign(
      mockFindFood,
      createFindFoodState({
        errorMessage: 'USDA FoodData Central is rate limited. Please try again later.',
        isLoading: true,
        status: 'loading',
      }),
    );

    render(<FindFoodScreen />);

    expect(
      screen.getByText('USDA FoodData Central is rate limited. Please try again later.'),
    ).toBeTruthy();
    expect(screen.getByText('Updating food results...')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Searching' })).toBeDisabled();
  });

  it('opens the real Add Food flow from Product Detail', () => {
    Object.assign(
      mockFindFood,
      createFindFoodState({
        selectedFood: createFoodResult(),
      }),
    );

    render(<FindFoodScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Add to Diary' }));

    expect(screen.getByText('Add food form for Chicken Breast')).toBeTruthy();
    expect(mockFindFood.showAddToDiaryPlaceholder).not.toHaveBeenCalled();
  });

  it('shows favorite foods in search home and can remove one', () => {
    Object.assign(mockFoodLibrary, {
      favorites: [
        {
          createdAt: '2026-08-19T00:00:00Z',
          food: createFoodResult({ name: 'Favorite Rice', sourceLabel: 'Favorite' }),
          foodId: 'food-id',
          id: 'favorite-id',
        },
      ],
    });

    render(<FindFoodScreen />);

    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getByText('Favorite Rice')).toBeTruthy();

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.press(removeButtons[removeButtons.length - 1]);

    expect(mockFoodLibrary.deleteFavorite).toHaveBeenCalledWith('favorite-id');
  });
});

function createFindFoodState(overrides: Partial<UseFindFoodResult> = {}): UseFindFoodResult {
  return {
    addToDiaryMessage: null,
    barcode: '',
    clearSelection: jest.fn(),
    errorMessage: null,
    externalId: '',
    isLoading: false,
    lookupBarcode: jest.fn(),
    lookupProviderId: jest.fn(),
    mealType: 'breakfast',
    mode: 'search',
    provider: 'usda',
    quantity: '1',
    query: '',
    results: [],
    recentFoods: [],
    autocompleteSuggestions: [],
    correctedQuery: null,
    search: jest.fn(),
    selectedFood: null,
    selectFood: jest.fn(),
    setBarcode: jest.fn(),
    setExternalId: jest.fn(),
    setMealType: jest.fn(),
    setMode: jest.fn(),
    setProvider: jest.fn(),
    setQuery: jest.fn(),
    setQuantity: jest.fn(),
    showAddToDiaryPlaceholder: jest.fn(),
    status: 'idle',
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
