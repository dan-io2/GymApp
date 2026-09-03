import { act, renderHook } from '@testing-library/react-native';

import { useAddFoodToDiary } from '../useAddFoodToDiary';
import type { FoodDiaryService } from '../../services/foodDiaryService';
import type { Food } from '../../types/foodTypes';

describe('useAddFoodToDiary', () => {
  it('defaults amount to the canonical gram serving and calculates one serving totals', () => {
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: createRiceFood(),
        service: createServiceMock(),
        userId: 'user-id',
      }),
    );

    expect(result.current.quantityText).toBe('45');
    expect(result.current.portionUnit).toBe('g');
    expect(result.current.preview).toMatchObject({
      calories: 160,
      proteinG: 3,
      carbsG: 36,
      fatG: 0,
    });
  });

  it('calculates half, one and a half, and two serving totals', () => {
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: createRiceFood(),
        service: createServiceMock(),
        userId: 'user-id',
      }),
    );

    act(() => result.current.setPortionUnit('serving'));
    act(() => result.current.setQuantityText('0.5'));
    expect(result.current.preview).toMatchObject({
      calories: 80,
      proteinG: 1.5,
      carbsG: 18,
      fatG: 0,
    });

    act(() => result.current.setQuantityText('1.5'));
    expect(result.current.preview).toMatchObject({
      calories: 240,
      proteinG: 4.5,
      carbsG: 54,
      fatG: 0,
    });

    act(() => result.current.setQuantityText('2'));
    expect(result.current.preview).toMatchObject({
      calories: 320,
      proteinG: 6,
      carbsG: 72,
      fatG: 0,
    });
    expect(result.current.totalServingAmount).toBe(90);
  });

  it('calculates Quest one, two, half, and eight serving totals from serving basis', () => {
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: createQuestFood(),
        service: createServiceMock(),
        userId: 'user-id',
      }),
    );

    expect(result.current.preview).toMatchObject({
      calories: 140,
      proteinG: 20,
      carbsG: 4,
      fatG: 4.5,
      sodiumMg: 320,
    });
    expect(result.current.totalServingAmount).toBe(32);

    act(() => result.current.setPortionUnit('serving'));
    act(() => result.current.setQuantityText('2'));
    expect(result.current.preview).toMatchObject({
      calories: 280,
      proteinG: 40,
      carbsG: 8,
      fatG: 9,
      sodiumMg: 640,
    });
    expect(result.current.totalServingAmount).toBe(64);

    act(() => result.current.setQuantityText('0.5'));
    expect(result.current.preview).toMatchObject({
      calories: 70,
      proteinG: 10,
      carbsG: 2,
      fatG: 2.25,
      sodiumMg: 160,
    });

    act(() => result.current.setQuantityText('8'));
    expect(result.current.preview).toMatchObject({
      calories: 1120,
      proteinG: 160,
      carbsG: 32,
      fatG: 36,
      sodiumMg: 2560,
    });
    expect(result.current.totalServingAmount).toBe(256);
  });

  it('lets the user choose a meal and stores total nutrition snapshot values', async () => {
    const service = createServiceMock();
    const onAdded = jest.fn();
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: createRiceFood(),
        onAdded,
        service,
        userId: 'user-id',
      }),
    );

    act(() => {
      result.current.setMealType('lunch');
      result.current.setPortionUnit('serving');
      result.current.setQuantityText('2');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(service.addLog).toHaveBeenCalledWith({
      food: createRiceFood(),
      itemQuantity: 1,
      mealType: 'lunch',
      portionAmount: 2,
      portionUnit: 'serving',
      quantity: 2,
      userId: 'user-id',
    });
    expect(onAdded).toHaveBeenCalledTimes(1);
  });

  it('adds a FatSecret restaurant food using its normalized serving', async () => {
    const service = createServiceMock();
    const food = createFatSecretFood();
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food,
        service,
        userId: 'user-id',
      }),
    );

    expect(result.current.preview).toMatchObject({
      calories: 180,
      proteinG: 32,
      carbsG: 0,
      fatG: 7,
    });

    await act(async () => {
      await result.current.save();
    });

    expect(service.addLog).toHaveBeenCalledWith({
      food,
      itemQuantity: 1,
      mealType: expect.any(String),
      portionAmount: 113,
      portionUnit: 'g',
      quantity: 1,
      userId: 'user-id',
    });
  });

  it('can calculate an alternate FatSecret serving option', () => {
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: {
          ...createFatSecretFood(),
          servingSize: 100,
          servingDescription: '100 g',
          calories: 159,
          proteinG: 28.3,
          carbsG: 0,
          fatG: 6.2,
          servingCalories: 159,
          servingProteinG: 28.3,
          servingCarbsG: 0,
          servingFatG: 6.2,
        },
        service: createServiceMock(),
        userId: 'user-id',
      }),
    );

    expect(result.current.quantityText).toBe('100');
    expect(result.current.preview).toMatchObject({
      calories: 159,
      proteinG: 28.3,
      carbsG: 0,
      fatG: 6.2,
    });
  });

  it('rejects zero and negative quantities before inserting', async () => {
    const service = createServiceMock();
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: createRiceFood(),
        service,
        userId: 'user-id',
      }),
    );

    act(() => result.current.setQuantityText('0'));

    await act(async () => {
      await result.current.save();
    });

    expect(service.addLog).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe('Enter an amount greater than zero.');

    act(() => result.current.setQuantityText('-1'));

    await act(async () => {
      await result.current.save();
    });

    expect(service.addLog).not.toHaveBeenCalled();
  });

  it('retains the form when insertion fails', async () => {
    const service = createServiceMock({
      addLog: jest.fn().mockRejectedValue(new Error('insert failed')),
    });
    const { result } = renderHook(() =>
      useAddFoodToDiary({
        food: createRiceFood(),
        service,
        userId: 'user-id',
      }),
    );

    act(() => {
      result.current.setMealType('snack');
      result.current.setQuantityText('1.5');
    });

    await act(async () => {
      await result.current.save();
    });

    expect(result.current.mealType).toBe('snack');
    expect(result.current.quantityText).toBe('1.5');
    expect(result.current.errorMessage).toBe(
      "We couldn't add this food to your diary. Your selections have not been lost.",
    );
  });
});

function createServiceMock(overrides: Partial<FoodDiaryService> = {}): FoodDiaryService {
  return {
    addLog: jest.fn().mockResolvedValue({}),
    calculateTotals: jest.fn(),
    deleteLog: jest.fn(),
    fetchLogsForLocalDate: jest.fn(),
    updateLog: jest.fn(),
    updateQuantity: jest.fn(),
    ...overrides,
  } as unknown as FoodDiaryService;
}

function createRiceFood(): Food {
  return {
    id: null,
    externalId: '0017400106959',
    source: 'open_food_facts',
    barcode: '0017400106959',
    name: 'Jasmine Thai Fragrant Rice',
    brand: 'Mahatma',
    servingSize: 45,
    servingUnit: 'g',
    servingDescription: '45 g',
    servingsPerContainer: null,
    servingBasis: 'per_serving',
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
    createdBy: null,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

function createQuestFood(): Food {
  return {
    id: null,
    externalId: 'quest',
    source: 'open_food_facts',
    barcode: 'quest',
    name: 'Protein Chips',
    brand: 'Quest Nutrition',
    servingSize: 32,
    servingUnit: 'g',
    servingDescription: '32 g',
    servingsPerContainer: 8,
    servingBasis: 'per_serving',
    servingCalories: 140,
    servingProteinG: 20,
    servingCarbsG: 4,
    servingFatG: 4.5,
    servingFiberG: 1,
    servingSugarG: 1,
    servingSodiumMg: 320,
    calories: 140,
    proteinG: 20,
    carbsG: 4,
    fatG: 4.5,
    fiberG: 1,
    sugarG: 1,
    sodiumMg: 320,
    createdBy: null,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

function createFatSecretFood(): Food {
  return {
    id: null,
    externalId: '1001',
    source: 'fatsecret',
    barcode: null,
    name: 'Chicken',
    brand: 'Chipotle',
    servingSize: 113,
    servingUnit: 'g',
    servingDescription: '1 serving',
    servingsPerContainer: null,
    servingBasis: 'per_serving',
    servingCalories: 180,
    servingProteinG: 32,
    servingCarbsG: 0,
    servingFatG: 7,
    servingFiberG: 0,
    servingSugarG: 0,
    servingSodiumMg: 310,
    calories: 180,
    proteinG: 32,
    carbsG: 0,
    fatG: 7,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 310,
    servingOptions: [
      {
        id: '2001',
        servingDescription: '1 serving',
        servingSize: 113,
        servingUnit: 'g',
        servingBasis: 'per_serving',
        calories: 180,
        proteinG: 32,
        carbsG: 0,
        fatG: 7,
        fiberG: 0,
        sugarG: 0,
        sodiumMg: 310,
        isDefault: true,
      },
      {
        id: '2002',
        servingDescription: '100 g',
        servingSize: 100,
        servingUnit: 'g',
        servingBasis: 'per_100g',
        calories: 159,
        proteinG: 28.3,
        carbsG: 0,
        fatG: 6.2,
        fiberG: 0,
        sugarG: 0,
        sodiumMg: 274,
        isDefault: false,
      },
    ],
    createdBy: null,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}
