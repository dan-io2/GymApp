import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { DiaryScreen } from '../DiaryScreen';
import type { UseDailyDiaryResult } from '../../hooks/useDailyDiary';
import type { FoodLog } from '../../types/foodTypes';
import {
  aggregateDailyNutrition,
  calculateNutritionProgress,
  groupLogsByMeal,
} from '../../utils/foodDiaryUtils';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDailyDiary: UseDailyDiaryResult = createDailyDiaryState();
const mockDashboardRefetch = jest.fn();
const mockFoodLibrary = {
  addFavorite: jest.fn(),
  clearMessage: jest.fn(),
  createSavedMeal: jest.fn().mockResolvedValue(true),
  deleteFavorite: jest.fn(),
  deleteSavedMeal: jest.fn(),
  errorMessage: null as string | null,
  favorites: [],
  isLoading: false,
  load: jest.fn(),
  logAgain: jest.fn().mockResolvedValue(true),
  logSavedMeal: jest.fn(),
  message: null as string | null,
  removeSavedMealItem: jest.fn(),
  renameSavedMeal: jest.fn(),
  savedMeals: [],
  status: 'success',
};

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => callback(),
  useRouter: () => ({
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

jest.mock('@/features/dashboard/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    data: {
      activeGoal: {
        dailyCalories: 2400,
        proteinG: 210,
        carbsG: 230,
        fatG: 72,
      },
    },
    errorMessage: null,
    isLoading: false,
    isRefreshing: false,
    refetch: mockDashboardRefetch,
  }),
}));

jest.mock('../../hooks/useDailyDiary', () => ({
  useDailyDiary: () => mockDailyDiary,
}));

jest.mock('@/features/saved-meals/hooks/useFoodLibrary', () => ({
  useFoodLibrary: () => mockFoodLibrary,
}));

describe('DiaryScreen', () => {
  beforeEach(() => {
    Object.assign(mockDailyDiary, createDailyDiaryState());
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockDashboardRefetch.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockFoodLibrary.createSavedMeal.mockClear();
    mockFoodLibrary.logAgain.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders daily progress and meal grouped logs', () => {
    render(<DiaryScreen />);

    expect(screen.getByText('Calories')).toBeTruthy();
    expect(screen.getByText('160 / 2400 kcal')).toBeTruthy();
    expect(screen.getByText('Lunch')).toBeTruthy();
    expect(screen.getByText('Jasmine Thai Fragrant Rice')).toBeTruthy();
    expect(screen.getAllByText('160 kcal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No foods yet')).toHaveLength(3);
  });

  it('opens Find Food from empty meal add actions', () => {
    render(<DiaryScreen />);

    fireEvent.press(screen.getAllByRole('button', { name: '+ Add Food' })[0]);

    expect(mockPush).toHaveBeenCalledWith('/find-food');
  });

  it('returns home from the diary header', () => {
    render(<DiaryScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Go Home' }));

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('edits quantity and meal type from a diary row', async () => {
    render(<DiaryScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Actions for Jasmine Thai Fragrant Rice' }));
    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.press(screen.getByRole('button', { name: 'Snacks' }));
    fireEvent.changeText(screen.getByLabelText('Quantity for Jasmine Thai Fragrant Rice'), '2');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockDailyDiary.updateLog).toHaveBeenCalledWith({
        log: expect.objectContaining({
          id: 'log-id',
        }),
        itemQuantity: 1,
        mealType: 'snack',
        portionAmount: 2,
        portionUnit: 'serving',
        quantity: 2,
      });
    });
  });

  it('asks for confirmation before deleting a row', () => {
    render(<DiaryScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Actions for Jasmine Thai Fragrant Rice' }));
    fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete diary item?',
      'This removes the food from today.',
      expect.any(Array),
    );
  });

  it('logs a previous diary row again and refreshes the diary', async () => {
    render(<DiaryScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Actions for Jasmine Thai Fragrant Rice' }));
    fireEvent.press(screen.getByRole('button', { name: 'Log Again' }));

    await waitFor(() => {
      expect(mockFoodLibrary.logAgain).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'log-id' }),
      );
      expect(mockDailyDiary.refetch).toHaveBeenCalled();
      expect(mockDashboardRefetch).toHaveBeenCalled();
    });
  });

  it('saves a populated meal section as a saved meal', async () => {
    render(<DiaryScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Save as Meal' }));
    fireEvent.changeText(screen.getByLabelText('Saved meal name for Lunch'), 'Post Workout');
    fireEvent.press(screen.getByRole('button', { name: 'Save Meal' }));

    await waitFor(() => {
      expect(mockFoodLibrary.createSavedMeal).toHaveBeenCalledWith({
        logs: [expect.objectContaining({ id: 'log-id' })],
        name: 'Post Workout',
      });
    });
  });
});

function createDailyDiaryState(): UseDailyDiaryResult {
  const logs = [createLog()];
  const totals = aggregateDailyNutrition(logs);

  return {
    deletingLogId: null,
    deleteLog: jest.fn().mockResolvedValue(true),
    errorMessage: null,
    isLoading: false,
    isRefreshing: false,
    logs,
    mealGroups: groupLogsByMeal(logs),
    progress: calculateNutritionProgress(
      {
        dailyCalories: 2400,
        proteinG: 210,
        carbsG: 230,
        fatG: 72,
      },
      totals,
    ),
    refetch: jest.fn(),
    savingLogId: null,
    status: 'success',
    totals,
    updateLog: jest.fn().mockResolvedValue(true),
  };
}

function createLog(overrides: Partial<FoodLog> = {}): FoodLog {
  return {
    id: 'log-id',
    userId: 'user-id',
    foodId: null,
    mealType: 'lunch',
    foodName: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    quantity: 1,
    itemQuantity: overrides.itemQuantity ?? 1,
    portionAmount: overrides.portionAmount ?? 1,
    portionUnit: overrides.portionUnit ?? 'serving',
    servingEquivalent: overrides.servingEquivalent ?? 1,
    servingSize: 45,
    servingUnit: 'g',
    servingCalories: 160,
    servingProteinG: 3,
    servingCarbsG: 36,
    servingFatG: 0,
    servingFiberG: null,
    servingSugarG: null,
    servingSodiumMg: null,
    calories: 160,
    proteinG: 3,
    carbsG: 36,
    fatG: 0,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    loggedAt: '2026-08-10T12:00:00Z',
    createdAt: '2026-08-10T12:00:00Z',
    ...overrides,
  };
}
