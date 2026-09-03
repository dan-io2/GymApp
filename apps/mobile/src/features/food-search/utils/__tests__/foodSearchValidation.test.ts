import {
  isValidBarcode,
  isValidFdcId,
  isValidFoodSearchQuery,
  normalizeBarcode,
  normalizeFdcId,
  normalizeFoodSearchQuery,
} from '../foodSearchValidation';

describe('foodSearchValidation', () => {
  it('normalizes search text without accepting empty searches', () => {
    expect(normalizeFoodSearchQuery('  chicken   breast  ')).toBe('chicken breast');
    expect(normalizeFoodSearchQuery('In N Out')).toBe('in-n-out');
    expect(normalizeFoodSearchQuery('chick fil a nuggets')).toBe('chick-fil-a nuggets');
    expect(normalizeFoodSearchQuery('mcdonalds big mac')).toBe("mcdonald's big mac");
    expect(normalizeFoodSearchQuery('chipolte chiken')).toBe('chipotle chicken');
    expect(isValidFoodSearchQuery(' c ')).toBe(false);
    expect(isValidFoodSearchQuery(' oats ')).toBe(true);
  });

  it('preserves leading zeroes while validating UPC and EAN barcodes', () => {
    const barcode = ' 012345678905 ';

    expect(normalizeBarcode(barcode)).toBe('012345678905');
    expect(isValidBarcode(barcode)).toBe(true);
  });

  it('rejects invalid barcode formats and checksums', () => {
    expect(isValidBarcode('012345678904')).toBe(false);
    expect(isValidBarcode('ABC123')).toBe(false);
    expect(isValidBarcode('1234567')).toBe(false);
  });

  it('normalizes and validates USDA FDC identifiers', () => {
    expect(normalizeFdcId(' 2646170 ')).toBe('2646170');
    expect(isValidFdcId('2646170')).toBe(true);
    expect(isValidFdcId('fdc-2646170')).toBe(false);
  });
});
