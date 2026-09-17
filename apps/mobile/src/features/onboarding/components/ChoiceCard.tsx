import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/design/theme';

type ChoiceCardProps<T extends string> = {
  description?: string;
  isSelected: boolean;
  onSelect: (value: T) => void;
  title: string;
  value: T;
};

export function ChoiceCard<T extends string>({
  description,
  isSelected,
  onSelect,
  title,
  value,
}: ChoiceCardProps<T>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelect(value)}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.radio, isSelected && styles.radioSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 64,
    padding: spacing.md,
  },
  selected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.88,
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  description: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  radio: {
    borderColor: colors.borderStrong,
    borderRadius: radii.capsule,
    borderWidth: 2,
    height: 20,
    width: 20,
  },
  radioSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
