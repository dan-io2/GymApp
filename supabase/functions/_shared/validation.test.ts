import { normalizeSearchQuery } from './validation.ts';

Deno.test('normalizes common free-text restaurant aliases', () => {
  const cases = new Map([
    ['in n out', 'in-n-out'],
    ['in-n-out', 'in-n-out'],
    ['chick fil a', 'chick-fil-a'],
    ['mcdonalds big mac', "mcdonald's big mac"],
    ['chipolte chiken', 'chipotle chicken'],
  ]);

  for (const [input, expected] of cases) {
    if (normalizeSearchQuery(input) !== expected) {
      throw new Error(`Expected ${input} to normalize to ${expected}.`);
    }
  }
});
