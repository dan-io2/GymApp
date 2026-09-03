import type { NutritionCalculationErrorCode } from './types';

export class NutritionCalculationError extends Error {
  constructor(
    message: string,
    readonly code: NutritionCalculationErrorCode,
  ) {
    super(message);
    this.name = 'NutritionCalculationError';
  }
}
