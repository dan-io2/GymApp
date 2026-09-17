import { kgToLb } from '@gymapp/nutrition';

import type { UnitSystem, WeightCheckIn } from '../types/progressTypes';

export function formatWeight(checkIn: WeightCheckIn, unit: UnitSystem): string {
  return unit === 'imperial'
    ? `${kgToLb(checkIn.weightKg).toFixed(1)} lb`
    : `${checkIn.weightKg.toFixed(1)} kg`;
}

export function formatWeightChange(changeKg: number, unit: UnitSystem): string {
  if (!Number.isFinite(changeKg)) {
    return 'Unavailable';
  }

  const magnitudeKg = Math.abs(changeKg);
  const magnitude = unit === 'imperial' && magnitudeKg > 0 ? kgToLb(magnitudeKg) : magnitudeKg;
  const signedValue = changeKg < 0 ? -magnitude : magnitude;

  return `${signedValue > 0 ? '+' : ''}${signedValue.toFixed(1)} ${unit === 'imperial' ? 'lb' : 'kg'}`;
}
