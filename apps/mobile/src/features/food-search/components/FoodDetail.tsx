import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.detailCard}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryButtonText}>{backLabel}</Text>
      </Pressable>

      <Text style={styles.sourceText}>Source: {food.sourceLabel}</Text>
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
        <Pressable
          accessibilityRole="button"
          onPress={onFavorite}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Favorite Food</Text>
        </Pressable>
      ) : null}
      <PrimaryButton disabled={false} label="Add to Diary" onPress={onAddToDiary} />

      {message ? <Text style={styles.infoMessage}>{message}</Text> : null}
    </View>
  );
}

function PrimaryButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
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
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  sourceText: {
    color: '#1f8a5b',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: '#17211b',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  detailMeta: {
    color: '#526057',
    fontSize: 16,
    fontWeight: '700',
  },
  attributionText: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '800',
  },
  nutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  nutrient: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    minWidth: '47%',
    padding: 12,
  },
  nutrientLabel: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nutrientValue: {
    color: '#17211b',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 6,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1f8a5b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '900',
  },
  infoMessage: {
    backgroundColor: '#eaf2ec',
    borderColor: '#cfe0d4',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1f7a54',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    padding: 14,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
});
