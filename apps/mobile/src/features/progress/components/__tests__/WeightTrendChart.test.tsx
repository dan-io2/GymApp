import { render, screen } from '@testing-library/react-native';

import type { WeightTrendPoint } from '../../types/progressTypes';
import { buildWeightChartGeometry, WeightTrendChart } from '../WeightTrendChart';

describe('WeightTrendChart', () => {
  it('renders an intentional empty state for zero points', () => {
    render(<WeightTrendChart points={[]} />);

    expect(screen.getByText('No trend yet')).toBeTruthy();
    expect(screen.queryByTestId('weight-trend-chart')).toBeNull();
  });

  it('centers one real point without fabricating line segments', () => {
    const geometry = buildWeightChartGeometry([point('2026-09-01', 200)], 300);

    expect(geometry.positions).toHaveLength(1);
    expect(geometry.positions[0].x).toBe(150);
    expect(geometry.positions[0].y).toBe(78);
    expect(geometry.segments).toHaveLength(0);
  });

  it('builds one line segment between each pair of recorded points', () => {
    const geometry = buildWeightChartGeometry(
      [point('2026-09-01', 200), point('2026-09-08', 198), point('2026-09-15', 199)],
      320,
    );

    expect(geometry.positions).toHaveLength(3);
    expect(geometry.segments).toHaveLength(2);
    expect(geometry.positions[0].x).toBeLessThan(geometry.positions[1].x);
    expect(geometry.positions[1].x).toBeLessThan(geometry.positions[2].x);
  });
});

function point(date: string, displayWeight: number): WeightTrendPoint {
  return { date, displayUnit: 'lb', displayWeight, weightKg: displayWeight / 2.2046226218 };
}
