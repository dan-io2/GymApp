import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName, SectionHeader } from '@/design/components';
import { accents, colors, controlHeights, radii, spacing, typography } from '@/design/theme';

type QuickActionsProps = {
  onCustomFood: () => void;
  onFindFood: () => void;
  onSavedMeals: () => void;
  onScanBarcode: () => void;
};

const ACTIONS: {
  color: string;
  icon: AppIconName;
  key: keyof QuickActionsProps;
  label: string;
  muted: string;
}[] = [
  {
    color: accents.nutrition.foreground,
    icon: 'search-outline',
    key: 'onFindFood',
    label: 'Find Food',
    muted: accents.nutrition.muted,
  },
  {
    color: accents.weight.foreground,
    icon: 'barcode-outline',
    key: 'onScanBarcode',
    label: 'Scan Barcode',
    muted: accents.weight.muted,
  },
  {
    color: accents.analytics.foreground,
    icon: 'create-outline',
    key: 'onCustomFood',
    label: 'Custom Food',
    muted: accents.analytics.muted,
  },
  {
    color: accents.carbohydrate.foreground,
    icon: 'restaurant-outline',
    key: 'onSavedMeals',
    label: 'Saved Meals',
    muted: accents.carbohydrate.muted,
  },
];

export function QuickActions(props: QuickActionsProps) {
  return (
    <View style={styles.container}>
      <SectionHeader subtitle="Log in fewer taps" title="Quick add" />
      <View style={styles.actions}>
        {ACTIONS.map((action) => (
          <Pressable
            accessibilityLabel={action.label}
            accessibilityRole="button"
            key={action.label}
            onPress={props[action.key]}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: action.muted }]}>
              <AppIcon color={action.color} name={action.icon} />
            </View>
            <Text style={styles.actionTitle}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: '48%',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: controlHeights.large,
    paddingHorizontal: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: radii.medium,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionTitle: { ...typography.caption, color: colors.textPrimary, flexShrink: 1 },
  pressed: { backgroundColor: colors.surfacePressed, transform: [{ scale: 0.985 }] },
});
