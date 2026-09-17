import { formatWeightChange } from '../progressFormatting';

describe('progress formatting', () => {
  it('formats a negative kilogram change in pounds without violating weight validation', () => {
    expect(formatWeightChange(-1, 'imperial')).toBe('-2.2 lb');
  });

  it('formats positive, zero, and metric changes', () => {
    expect(formatWeightChange(1, 'imperial')).toBe('+2.2 lb');
    expect(formatWeightChange(0, 'imperial')).toBe('0.0 lb');
    expect(formatWeightChange(-1.25, 'metric')).toBe('-1.3 kg');
  });

  it('renders malformed stored changes as unavailable instead of throwing', () => {
    expect(formatWeightChange(Number.NaN, 'imperial')).toBe('Unavailable');
    expect(formatWeightChange(Number.POSITIVE_INFINITY, 'metric')).toBe('Unavailable');
  });
});
