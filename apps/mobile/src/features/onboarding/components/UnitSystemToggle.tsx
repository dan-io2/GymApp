import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    backgroundColor: '#e7eee7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  option: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#1f8a5b',
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '800',
  },
  selectedLabel: {
    color: '#ffffff',
  },
  subtitle: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '700',
  },
});
