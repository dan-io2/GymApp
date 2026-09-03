import { cmToInches, inchesToCm, kgToLb, lbToKg } from '@gymapp/nutrition';

import type { OnboardingFormState, UnitSystem } from '../types/onboardingTypes';

export function createInitialOnboardingState(
  unitSystem: UnitSystem = 'imperial',
): OnboardingFormState {
  return {
    unitSystem,
    dateOfBirth: '',
    sexForCalculation: null,
    heightCm: '',
    heightFeet: '',
    heightInches: '',
    weightKg: '',
    weightLb: '',
    activityLevel: null,
    goalType: null,
    targetWeightKg: '',
    targetWeightLb: '',
    weeklyRateKg: '',
    weeklyRateLb: '',
  };
}

export function switchUnitSystem(
  state: OnboardingFormState,
  nextUnitSystem: UnitSystem,
): OnboardingFormState {
  if (state.unitSystem === nextUnitSystem) {
    return state;
  }

  if (nextUnitSystem === 'metric') {
    return {
      ...state,
      unitSystem: nextUnitSystem,
      heightCm:
        convertImperialHeightToCmInput(state.heightFeet, state.heightInches) ?? state.heightCm,
      weightKg: convertPoundsInputToKgInput(state.weightLb) ?? state.weightKg,
      targetWeightKg: convertPoundsInputToKgInput(state.targetWeightLb) ?? state.targetWeightKg,
      weeklyRateKg: convertPoundsInputToKgInput(state.weeklyRateLb) ?? state.weeklyRateKg,
    };
  }

  const imperialHeight = convertCmInputToImperialHeight(state.heightCm);

  return {
    ...state,
    unitSystem: nextUnitSystem,
    heightFeet: imperialHeight?.feet ?? state.heightFeet,
    heightInches: imperialHeight?.inches ?? state.heightInches,
    weightLb: convertKgInputToPoundsInput(state.weightKg) ?? state.weightLb,
    targetWeightLb: convertKgInputToPoundsInput(state.targetWeightKg) ?? state.targetWeightLb,
    weeklyRateLb: convertKgInputToPoundsInput(state.weeklyRateKg) ?? state.weeklyRateLb,
  };
}

export function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value.trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function getHeightCm(state: OnboardingFormState): number | null {
  if (state.unitSystem === 'metric') {
    return parsePositiveNumber(state.heightCm);
  }

  const feet = Number(state.heightFeet.trim() || '0');
  const inches = Number(state.heightInches.trim() || '0');

  if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) {
    return null;
  }

  const totalInches = feet * 12 + inches;

  if (totalInches <= 0) {
    return null;
  }

  return inchesToCm(totalInches);
}

export function getCurrentWeightKg(state: OnboardingFormState): number | null {
  return getWeightKgForUnitSystem(state.unitSystem, state.weightKg, state.weightLb);
}

export function getTargetWeightKg(state: OnboardingFormState): number | null {
  const rawValue = state.unitSystem === 'metric' ? state.targetWeightKg : state.targetWeightLb;

  if (!rawValue.trim()) {
    return null;
  }

  return getWeightKgForUnitSystem(state.unitSystem, state.targetWeightKg, state.targetWeightLb);
}

export function getWeeklyRateKg(state: OnboardingFormState): number | null {
  const rawValue = state.unitSystem === 'metric' ? state.weeklyRateKg : state.weeklyRateLb;

  if (!rawValue.trim()) {
    return null;
  }

  return getWeightKgForUnitSystem(state.unitSystem, state.weeklyRateKg, state.weeklyRateLb);
}

export function formatDecimal(value: number, fractionDigits = 1): string {
  return Number(value.toFixed(fractionDigits)).toString();
}

function getWeightKgForUnitSystem(
  unitSystem: UnitSystem,
  kgValue: string,
  lbValue: string,
): number | null {
  const parsed = parsePositiveNumber(unitSystem === 'metric' ? kgValue : lbValue);

  if (parsed === null) {
    return null;
  }

  return unitSystem === 'metric' ? parsed : lbToKg(parsed);
}

function convertPoundsInputToKgInput(value: string): string | undefined {
  const parsed = parsePositiveNumber(value);

  if (parsed === null) {
    return undefined;
  }

  return formatDecimal(lbToKg(parsed), 1);
}

function convertKgInputToPoundsInput(value: string): string | undefined {
  const parsed = parsePositiveNumber(value);

  if (parsed === null) {
    return undefined;
  }

  return formatDecimal(kgToLb(parsed), 1);
}

function convertImperialHeightToCmInput(
  feetValue: string,
  inchesValue: string,
): string | undefined {
  const feet = Number(feetValue.trim() || '0');
  const inches = Number(inchesValue.trim() || '0');

  if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) {
    return undefined;
  }

  const totalInches = feet * 12 + inches;

  if (totalInches <= 0) {
    return undefined;
  }

  return formatDecimal(inchesToCm(totalInches), 1);
}

function convertCmInputToImperialHeight(
  value: string,
): { feet: string; inches: string } | undefined {
  const parsed = parsePositiveNumber(value);

  if (parsed === null) {
    return undefined;
  }

  const totalInches = Math.round(cmToInches(parsed));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return {
    feet: feet.toString(),
    inches: inches.toString(),
  };
}
