import { StyleSheet, Text } from 'react-native';

import { AppCard, ProgressBar } from '@/design/components';
import { accents, colors, spacing, typography } from '@/design/theme';
import type { MacroProgress } from '@/features/diary/types/foodTypes';

import {
  formatMacroGramsWithUnit,
  formatProgressStatus,
  getClampedProgressRatio,
} from '../utils/dashboardFormatting';

type MacroTargetCardProps = {
  label: 'Protein' | 'Carbs' | 'Fat';
  progress: MacroProgress;
};

export function MacroTargetCard({ label, progress }: MacroTargetCardProps) {
  const overTarget = progress.overage > 0;
  const palette = macroPalettes[label];
  const statusText = formatProgressStatus({
    overage: progress.overage,
    remaining: progress.remaining,
    unit: 'g',
  });

  return (
    <AppCard
      accessibilityLabel={`${label} consumed ${formatMacroGramsWithUnit(progress.consumed)} of ${formatMacroGramsWithUnit(progress.target)}, ${statusText}`}
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderTopColor: palette.foreground },
      ]}
    >
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.value}>
        {formatMacroGramsWithUnit(progress.consumed)}
      </Text>
      <Text style={styles.target}>of {formatMacroGramsWithUnit(progress.target)}</Text>
      <ProgressBar
        color={palette.foreground}
        overTarget={overTarget}
        progress={getClampedProgressRatio(progress.progressRatio)}
        testID={`${label.toLowerCase()}-progress-fill`}
      />
      <Text style={[styles.status, overTarget && styles.over]}>{statusText}</Text>
    </AppCard>
  );
}

const macroPalettes = {
  Protein: accents.nutrition,
  Carbs: accents.carbohydrate,
  Fat: accents.fat,
};

const styles = StyleSheet.create({
  card: {
    borderTopWidth: 2,
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
    padding: spacing.sm,
  },
  label: typography.caption,
  value: {
    ...typography.metric,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xxs,
  },
  target: { ...typography.micro, color: colors.textMuted },
  status: { ...typography.micro, color: colors.textMuted, minHeight: 28 },
  over: { color: colors.warning },
});
