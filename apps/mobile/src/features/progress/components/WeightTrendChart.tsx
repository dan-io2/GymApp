import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/theme';

import type { WeightTrendPoint } from '../types/progressTypes';

const CHART_HEIGHT = 156;
const PADDING = 14;
const LINE_WIDTH = 3;

type ChartPosition = { x: number; y: number };

type ChartSegment = {
  angle: string;
  left: number;
  length: number;
  top: number;
};

export type WeightChartGeometry = {
  positions: ChartPosition[];
  segments: ChartSegment[];
};

export function buildWeightChartGeometry(
  points: WeightTrendPoint[],
  width: number,
  height = CHART_HEIGHT,
): WeightChartGeometry {
  if (points.length === 0 || width <= 0) {
    return { positions: [], segments: [] };
  }

  const values = points.map((point) => point.displayWeight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const isFlat = max === min;
  const drawableWidth = Math.max(width - PADDING * 2, 1);
  const drawableHeight = height - PADDING * 2;
  const positions = points.map((point, index) => ({
    x:
      PADDING +
      (points.length === 1 ? drawableWidth / 2 : (index / (points.length - 1)) * drawableWidth),
    y: isFlat ? height / 2 : PADDING + ((max - point.displayWeight) / span) * drawableHeight,
  }));
  const segments = positions.slice(1).map((end, index) => {
    const start = positions[index];
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    return {
      angle: `${Math.atan2(deltaY, deltaX)}rad`,
      left: (start.x + end.x) / 2 - length / 2,
      length,
      top: (start.y + end.y) / 2 - LINE_WIDTH / 2,
    };
  });

  return { positions, segments };
}

export function WeightTrendChart({ points }: { points: WeightTrendPoint[] }) {
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No trend yet</Text>
        <Text style={styles.emptyText}>Add a weight check-in to begin your trend.</Text>
      </View>
    );
  }

  const values = points.map((point) => point.displayWeight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const first = points[0];
  const latest = points.at(-1)!;
  const summary = `${points.length} weight check-ins from ${first.date} to ${latest.date}. Latest ${latest.displayWeight} ${latest.displayUnit}. Range ${min} to ${max} ${latest.displayUnit}.`;
  const geometry = buildWeightChartGeometry(points, width);

  return (
    <View accessibilityLabel={summary} accessible>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.chart}
        testID="weight-trend-chart"
      >
        <View style={[styles.guide, styles.guideTop]} />
        <View style={[styles.guide, styles.guideMiddle]} />
        <View style={[styles.guide, styles.guideBottom]} />
        {geometry.segments.map((segment, index) => (
          <View
            key={`${points[index].date}-${points[index + 1].date}`}
            style={[
              styles.segment,
              {
                left: segment.left,
                top: segment.top,
                transform: [{ rotate: segment.angle }],
                width: segment.length,
              },
            ]}
            testID={`weight-trend-segment-${index}`}
          />
        ))}
        {geometry.positions.map((position, index) => {
          const latestPoint = index === geometry.positions.length - 1;
          const radius = latestPoint ? 5 : 4;

          return (
            <View
              key={points[index].date}
              style={[
                styles.point,
                latestPoint && styles.latestPoint,
                {
                  borderRadius: radius,
                  height: radius * 2,
                  left: position.x - radius,
                  top: position.y - radius,
                  width: radius * 2,
                },
              ]}
              testID={`weight-trend-point-${index}`}
            />
          );
        })}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisText}>{formatDate(first.date)}</Text>
        <Text style={styles.latestLabel}>
          Latest {latest.displayWeight} {latest.displayUnit}
        </Text>
        <Text style={styles.axisText}>{formatDate(latest.date)}</Text>
      </View>
    </View>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
    new Date(`${value}T12:00:00`),
  );
}

const styles = StyleSheet.create({
  chart: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    height: CHART_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  guide: {
    backgroundColor: colors.borderSubtle,
    height: StyleSheet.hairlineWidth,
    left: PADDING,
    opacity: 0.7,
    position: 'absolute',
    right: PADDING,
  },
  guideTop: { top: PADDING },
  guideMiddle: { top: CHART_HEIGHT / 2 },
  guideBottom: { bottom: PADDING },
  segment: {
    backgroundColor: colors.weight,
    borderRadius: radii.capsule,
    height: LINE_WIDTH,
    position: 'absolute',
  },
  point: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.weight,
    borderWidth: 2,
    position: 'absolute',
  },
  latestPoint: { backgroundColor: colors.weight },
  axis: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  axisText: { ...typography.micro, color: colors.textMuted },
  latestLabel: { ...typography.micro, color: colors.weight, flexShrink: 1, textAlign: 'center' },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.card,
    gap: spacing.xs,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: { ...typography.cardTitle, color: colors.textPrimary },
  emptyText: { ...typography.secondary, color: colors.textSecondary, textAlign: 'center' },
});
