import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { MacroProgress } from '@/features/diary/types/foodTypes';

import { MacroTargetCard } from '../MacroTargetCard';

describe('MacroTargetCard', () => {
  it('renders under-target macro values with useful decimal precision', () => {
    render(
      <MacroTargetCard
        label="Protein"
        progress={createProgress({ consumed: 96.3, target: 177 })}
      />,
    );

    expect(screen.getByText('96.3 g')).toBeTruthy();
    expect(screen.getByText('of 177 g')).toBeTruthy();
    expect(screen.getByText('80.7 g remaining')).toBeTruthy();
  });

  it('renders exact macro target without a trailing decimal', () => {
    render(
      <MacroTargetCard label="Protein" progress={createProgress({ consumed: 177, target: 177 })} />,
    );

    expect(screen.getByText('177 g')).toBeTruthy();
    expect(screen.getByText('of 177 g')).toBeTruthy();
    expect(screen.getByText('Target reached')).toBeTruthy();
  });

  it('renders over-target macro values without crowded slash text', () => {
    render(
      <MacroTargetCard label="Carbs" progress={createProgress({ consumed: 297.2, target: 179 })} />,
    );

    expect(screen.getByText('297.2 g')).toBeTruthy();
    expect(screen.getByText('of 179 g')).toBeTruthy();
    expect(screen.getByText('118.2 g over target')).toBeTruthy();
    expect(screen.queryByText(/297.2 \/ 179/)).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('carbs-progress-fill').props.style)).toEqual(
      expect.objectContaining({ width: '100%' }),
    );
  });

  it('keeps very large macro values readable', () => {
    render(
      <MacroTargetCard label="Fat" progress={createProgress({ consumed: 1000, target: 200 })} />,
    );

    expect(screen.getByText('1,000 g')).toBeTruthy();
    expect(screen.getByText('of 200 g')).toBeTruthy();
    expect(screen.getByText('800 g over target')).toBeTruthy();
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
