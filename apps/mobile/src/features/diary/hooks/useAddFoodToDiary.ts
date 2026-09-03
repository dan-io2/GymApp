import { useMemo, useState } from 'react';

import type { Food, MealType } from '../types/foodTypes';
import type { FoodDiaryService } from '../services/foodDiaryService';
import {
  foodDiaryService as defaultFoodDiaryService,
  FoodDiaryError,
} from '../services/foodDiaryService';
import {
  calculateFoodLogSnapshot,
  formatQuantity,
  getDefaultMealType,
} from '../utils/foodDiaryUtils';
import {
  convertPortionAmount,
  calculatePortionNutrition,
  formatPortionAmount,
  getDefaultPortion,
  getPortionUnitOptions,
  parsePortionAmount,
} from '../utils/portionUtils';

type AddFoodStatus = 'idle' | 'saving' | 'success' | 'error';

export type UseAddFoodToDiaryResult = {
  mealType: MealType;
  itemQuantityText: string;
  quantityText: string;
  quantity: number;
  portionUnit: string;
  portionUnitOptions: ReturnType<typeof getPortionUnitOptions>;
  status: AddFoodStatus;
  errorMessage: string | null;
  isSaving: boolean;
  preview: ReturnType<typeof calculateFoodLogSnapshot>;
  totalServingAmount: number | null;
  totalServingUnit: string | null;
  setMealType: (mealType: MealType) => void;
  setItemQuantityText: (value: string) => void;
  setQuantityText: (value: string) => void;
  incrementItemQuantity: () => void;
  decrementItemQuantity: () => void;
  setPortionUnit: (unit: string) => void;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
  save: () => Promise<void>;
};

export function useAddFoodToDiary({
  food,
  onAdded,
  service = defaultFoodDiaryService,
  userId,
}: {
  food: Food;
  onAdded?: () => void;
  service?: FoodDiaryService;
  userId: string | undefined;
}): UseAddFoodToDiaryResult {
  const [mealType, setMealType] = useState<MealType>(() => getDefaultMealType());
  const defaultPortion = useMemo(() => getDefaultPortion(food), [food]);
  const [itemQuantityText, setItemQuantityText] = useState('1');
  const [quantityText, setQuantityText] = useState(() =>
    formatPortionAmount(defaultPortion.amount),
  );
  const [portionUnit, setPortionUnitState] = useState(defaultPortion.unit);
  const [status, setStatus] = useState<AddFoodStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedAmount = parsePortionAmount(quantityText);
  const parsedItemQuantity = parsePortionAmount(itemQuantityText);
  const amount = parsedAmount ?? defaultPortion.amount;
  const itemQuantity = parsedItemQuantity ?? 1;
  const portionUnitOptions = useMemo(() => getPortionUnitOptions(food), [food]);

  const preview = useMemo(
    () =>
      calculateFoodLogSnapshot({
        food,
        itemQuantity,
        mealType,
        portionAmount: amount,
        portionUnit,
        quantity: 1,
        userId: userId ?? 'preview-user',
      }),
    [amount, food, itemQuantity, mealType, portionUnit, userId],
  );
  const portionPreview = useMemo(
    () => calculatePortionNutrition({ amount, food, itemQuantity, unit: portionUnit }),
    [amount, food, itemQuantity, portionUnit],
  );

  return {
    mealType,
    itemQuantityText,
    quantityText,
    quantity: preview.servingEquivalent,
    portionUnit,
    portionUnitOptions,
    status,
    errorMessage,
    isSaving: status === 'saving',
    preview,
    totalServingAmount: portionPreview.normalizedAmount,
    totalServingUnit: portionPreview.normalizedUnit,
    setMealType(nextMealType) {
      setMealType(nextMealType);
      setErrorMessage(null);
      setStatus('idle');
    },
    setItemQuantityText(value) {
      setItemQuantityText(value);
      setErrorMessage(null);
      setStatus('idle');
    },
    setQuantityText(value) {
      setQuantityText(value);
      setErrorMessage(null);
      setStatus('idle');
    },
    setPortionUnit(nextUnit) {
      if (nextUnit === portionUnit) {
        return;
      }

      if (parsedAmount !== null) {
        try {
          const converted = convertPortionAmount({
            amount: parsedAmount,
            food,
            fromUnit: portionUnit,
            toUnit: nextUnit,
          });

          setQuantityText(formatPortionAmount(converted));
        } catch {
          setErrorMessage('That unit is not available for this food.');
          setStatus('error');
          return;
        }
      }

      setPortionUnitState(nextUnit);
      setErrorMessage(null);
      setStatus('idle');
    },
    incrementQuantity() {
      setQuantityText(formatQuantity((parsedAmount ?? 0) + getIncrement(portionUnit)));
      setErrorMessage(null);
      setStatus('idle');
    },
    decrementQuantity() {
      const nextQuantity = Math.max(
        getIncrement(portionUnit),
        (parsedAmount ?? 1) - getIncrement(portionUnit),
      );

      setQuantityText(formatQuantity(nextQuantity));
      setErrorMessage(null);
      setStatus('idle');
    },
    incrementItemQuantity() {
      setItemQuantityText(formatQuantity((parsedItemQuantity ?? 0) + 1));
      setErrorMessage(null);
      setStatus('idle');
    },
    decrementItemQuantity() {
      setItemQuantityText(formatQuantity(Math.max(1, (parsedItemQuantity ?? 1) - 1)));
      setErrorMessage(null);
      setStatus('idle');
    },
    async save() {
      if (status === 'saving') {
        return;
      }

      if (!userId) {
        setStatus('error');
        setErrorMessage('You must be signed in to add food.');
        return;
      }

      if (parsedAmount === null) {
        setStatus('error');
        setErrorMessage('Enter an amount greater than zero.');
        return;
      }

      if (parsedItemQuantity === null) {
        setStatus('error');
        setErrorMessage('Enter a quantity greater than zero.');
        return;
      }

      setStatus('saving');
      setErrorMessage(null);

      try {
        await service.addLog({
          food,
          itemQuantity: parsedItemQuantity,
          mealType,
          portionAmount: parsedAmount,
          portionUnit,
          quantity: preview.servingEquivalent,
          userId,
        });
        setStatus('success');
        onAdded?.();
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          "We couldn't add this food to your diary. Your selections have not been lost.",
        );

        if (__DEV__) {
          console.info('[GymApp add food]', {
            code: error instanceof FoodDiaryError ? (error.code ?? null) : null,
            foodSource: food.source,
            mealType,
            message: error instanceof Error ? error.message : 'Unknown add food error',
            quantity: preview.servingEquivalent,
          });
        }
      }
    },
  };
}

function getIncrement(unit: string): number {
  return unit === 'serving' ? 0.5 : 1;
}
