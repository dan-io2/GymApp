import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { MacroProgress } from '@/features/diary/types/foodTypes';

import { CalorieTargetCard } from '../CalorieTargetCard';

describe('CalorieTargetCard', () => {
  it('renders under-target calories with responsive target text', () => {
    render(<CalorieTargetCard progress={createProgress({ consumed: 500, target: 2500 })} />);

    expect(screen.getByRole('header', { name: '500' })).toBeTruthy();
    expect(screen.getByText('of 2,500 kcal')).toBeTruthy();
    expect(screen.getByText('2,000 kcal remaining')).toBeTruthy();
  });

  it('renders exact target without negative remaining wording', () => {
    render(<CalorieTargetCard progress={createProgress({ consumed: 2133, target: 2133 })} />);

    expect(screen.getByRole('header', { name: '2,133' })).toBeTruthy();
    expect(screen.getByText('Target reached')).toBeTruthy();
    expect(screen.queryByText(/-/)).toBeNull();
  });

  it('renders over-target calories without overflowing progress fill', () => {
    render(<CalorieTargetCard progress={createProgress({ consumed: 2494.45, target: 2133 })} />);

    expect(screen.getByRole('header', { name: '2,494' })).toBeTruthy();
    expect(screen.getByText('of 2,133 kcal')).toBeTruthy();
    expect(screen.getByText('361 kcal over target')).toBeTruthy();
    expect(screen.queryByText(/remaining/)).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('calorie-progress-fill').props.style)).toEqual(
      expect.objectContaining({ width: '100%' }),
    );
  });

  it('keeps very large values readable', () => {
    render(<CalorieTargetCard progress={createProgress({ consumed: 10000, target: 2500 })} />);

    expect(screen.getByRole('header', { name: '10,000' })).toBeTruthy();
    expect(screen.getByText('of 2,500 kcal')).toBeTruthy();
    expect(screen.getByText('7,500 kcal over target')).toBeTruthy();
  });
});

function createProgress({ consumed, target }: { consumed: number; target: number }): MacroProgress {
  const remaining = Math.max(0, target - consumed);
  const overage = Math.max(0, consumed - target);

  return {
    consumed,
    target,
    remaining,
    overage,
    percentage: target > 0 ? (consumed / target) * 100 : 0,
    progressRatio: target > 0 ? consumed / target : 0,
  };
}
