import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, StatusPill } from '@/design/components';
import { colors, radii, spacing, typography } from '@/design/theme';

import type { FoodSearchResult } from '../types/foodSearchTypes';

type FoodDetailProps = {
  backLabel?: string;
  food: FoodSearchResult;
  message?: string | null;
  onAddToDiary: () => void;
  onBack: () => void;
  onFavorite?: () => void;
};

export function FoodDetail({
  backLabel = 'Back to Results',
  food,
  message = null,
  onAddToDiary,
  onBack,
  onFavorite,
}: FoodDetailProps) {
  return (
    <AppCard raised style={styles.detailCard}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryButtonText}>{backLabel}</Text>
      </Pressable>

      <StatusPill icon="server-outline" label={food.sourceLabel} tone="information" />
      <Text style={styles.detailTitle}>{food.name}</Text>
      {food.brand ? <Text style={styles.detailMeta}>{food.brand}</Text> : null}
      <Text style={styles.detailMeta}>Serving: {formatServing(food)}</Text>
      <Text style={styles.detailMeta}>{formatBasis(food)}</Text>
      {food.servingsPerContainer ? (
        <Text style={styles.detailMeta}>Servings per container: {food.servingsPerContainer}</Text>
      ) : null}
      {food.servingOptions && food.servingOptions.length > 1 ? (
        <Text style={styles.detailMeta}>
          {food.servingOptions.length} serving options available when adding to diary.
        </Text>
      ) : null}
      {food.barcode ? <Text style={styles.detailMeta}>Barcode: {food.barcode}</Text> : null}
      {food.source === 'fatsecret' ? (
        <Text style={styles.attributionText}>Nutrition data from FatSecret.</Text>
      ) : null}

      <View style={styles.nutrientGrid}>
        <Nutrient label="Calories" value={`${food.calories.toLocaleString('en-US')} kcal`} />
        <Nutrient label="Protein" value={`${food.proteinG} g`} />
        <Nutrient label="Carbs" value={`${food.carbsG} g`} />
        <Nutrient label="Fat" value={`${food.fatG} g`} />
        {food.fiberG !== null ? <Nutrient label="Fiber" value={`${food.fiberG} g`} /> : null}
        {food.sugarG !== null ? <Nutrient label="Sugar" value={`${food.sugarG} g`} /> : null}
        {food.sodiumMg !== null ? <Nutrient label="Sodium" value={`${food.sodiumMg} mg`} /> : null}
      </View>

      {onFavorite ? (
        <AppButton
          icon="heart-outline"
          label="Favorite Food"
          onPress={onFavorite}
          tone="secondary"
        />
      ) : null}
      <AppButton icon="add" label="Add to Diary" onPress={onAddToDiary} />

      {message ? <Text style={styles.infoMessage}>{message}</Text> : null}
    </AppCard>
  );
}

function Nutrient({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nutrient}>
      <Text style={styles.nutrientLabel}>{label}</Text>
      <Text style={styles.nutrientValue}>{value}</Text>
    </View>
  );
}

function formatServing(food: FoodSearchResult): string {
  if (food.servingDescription) {
    return food.servingDescription;
  }

  if (food.servingBasis === 'per_100g') {
    return 'per 100g';
  }

  if (food.servingSize && food.servingUnit) {
    return `${food.servingSize} ${food.servingUnit}`;
  }

  return 'serving basis unavailable';
}

function formatBasis(food: FoodSearchResult): string {
  if (food.servingBasis === 'per_serving') {
    return food.servingSize && food.servingUnit
      ? `Nutrition per serving (${food.servingSize} ${food.servingUnit})`
      : 'Nutrition per serving';
  }

  if (food.servingBasis === 'per_100g') {
    return 'Nutrition per 100 g';
  }

  if (food.servingBasis === 'per_100ml') {
    return 'Nutrition per 100 ml';
  }

  return 'Nutrition basis unavailable';
}

const styles = StyleSheet.create({
  detailCard: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  detailTitle: {
    ...typography.metric,
    color: colors.textPrimary,
  },
  detailMeta: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  attributionText: {
    ...typography.micro,
    color: colors.textMuted,
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  nutrient: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    minWidth: '47%',
    padding: spacing.sm,
  },
  nutrientLabel: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  nutrientValue: {
    ...typography.cardTitle,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  infoMessage: {
    ...typography.secondary,
    backgroundColor: colors.successMuted,
    borderColor: colors.success,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.success,
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
  },
});
