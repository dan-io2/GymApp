import { StyleSheet, Text, View } from 'react-native';

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
  const clampedProgressRatio = getClampedProgressRatio(progress.progressRatio);
  const statusText = formatProgressStatus({
    overage: progress.overage,
    remaining: progress.remaining,
    unit: 'g',
  });

  return (
    <View
      accessibilityLabel={`${label} consumed ${formatMacroGramsWithUnit(progress.consumed)} of ${formatMacroGramsWithUnit(progress.target)}, ${statusText}`}
      style={[styles.card, progress.overage > 0 && styles.cardOverTarget]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatMacroGramsWithUnit(progress.consumed)}</Text>
      <Text style={styles.target}>of {formatMacroGramsWithUnit(progress.target)}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            progress.overage > 0 && styles.barFillOverTarget,
            { width: `${clampedProgressRatio * 100}%` },
          ]}
          testID={`${label.toLowerCase()}-progress-fill`}
        />
      </View>
      <Text style={[styles.share, progress.overage > 0 && styles.shareOverTarget]}>
        {statusText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 96,
    padding: 14,
  },
  cardOverTarget: {
    backgroundColor: '#f4fbf6',
    borderColor: '#a7d9bc',
  },
  label: {
    color: '#526057',
    fontSize: 14,
    fontWeight: '800',
  },
  value: {
    color: '#17211b',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
  },
  target: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  barTrack: {
    backgroundColor: '#e7ede8',
    borderRadius: 4,
    height: 8,
    marginTop: 14,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#1f8a5b',
    borderRadius: 4,
    height: 8,
  },
  barFillOverTarget: {
    backgroundColor: '#55b978',
  },
  share: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  shareOverTarget: {
    color: '#1f7a54',
    fontWeight: '800',
  },
});
