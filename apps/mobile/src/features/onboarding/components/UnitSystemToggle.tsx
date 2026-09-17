import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/theme';

import type { UnitSystem } from '../types/onboardingTypes';

type UnitSystemToggleProps = {
  onChange: (value: UnitSystem) => void;
  value: UnitSystem;
};

export function UnitSystemToggle({ onChange, value }: UnitSystemToggleProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      <UnitOption
        isSelected={value === 'imperial'}
        label="Imperial"
        onPress={() => onChange('imperial')}
        subtitle="lb / ft"
      />
      <UnitOption
        isSelected={value === 'metric'}
        label="Metric"
        onPress={() => onChange('metric')}
        subtitle="kg / cm"
      />
    </View>
  );
}

function UnitOption({
  isSelected,
  label,
  onPress,
  subtitle,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
  subtitle: string;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>{label}</Text>
      <Text style={[styles.subtitle, isSelected && styles.selectedLabel]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.xxs,
    padding: spacing.xxs,
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.small,
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.surfaceInteractive,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  selectedLabel: {
    color: colors.accent,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
