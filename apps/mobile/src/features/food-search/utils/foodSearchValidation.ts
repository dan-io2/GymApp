export function normalizeFoodSearchQuery(query: string): string {
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();

  return normalized
    .replace(/\bin\s+n\s+out\b/g, 'in-n-out')
    .replace(/\bchick\s+fil\s+a\b/g, 'chick-fil-a')
    .replace(/\bmcdonalds\b/g, "mcdonald's")
    .replace(/\bchipolte\b/g, 'chipotle')
    .replace(/\bchiken\b/g, 'chicken')
    .replace(/\bnugits\b/g, 'nuggets')
    .replace(/\bin\s+n\s+otu\b/g, 'in-n-out');
}

export function isValidFoodSearchQuery(query: string): boolean {
  return normalizeFoodSearchQuery(query).length >= 2;
}

export function normalizeBarcode(barcode: string): string {
  return barcode.trim();
}

export function isValidBarcode(barcode: string): boolean {
  const normalized = normalizeBarcode(barcode);

  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(normalized)) {
    return false;
  }

  return hasValidGtInChecksum(normalized);
}

export function normalizeFdcId(value: string): string {
  return value.trim();
}

export function isValidFdcId(value: string): boolean {
  return /^\d+$/.test(normalizeFdcId(value));
}

export function normalizeProviderFoodId(value: string): string {
  return value.trim();
}

export function isValidProviderFoodId(value: string): boolean {
  return /^\d+$/.test(normalizeProviderFoodId(value));
}

function hasValidGtInChecksum(value: string): boolean {
  const digits = value.split('').map(Number);
  const checkDigit = digits.pop();

  if (checkDigit === undefined) {
    return false;
  }

  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  const expected = (10 - (sum % 10)) % 10;

  return checkDigit === expected;
}
