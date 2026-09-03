import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthMessage } from '@/features/auth/components/AuthMessage';

import { useAddFoodToDiary } from '../hooks/useAddFoodToDiary';
import type { Food, MealType } from '../types/foodTypes';
import { MEAL_LABELS, MEAL_TYPES, formatNutritionValue } from '../utils/foodDiaryUtils';

type AddFoodPanelProps = {
  food: Food;
  onAdded: () => void;
  userId: string | undefined;
};

export function AddFoodPanel({ food, onAdded, userId }: AddFoodPanelProps) {
  const defaultServingId =
    food.servingOptions?.find((option) => option.isDefault)?.id ?? food.servingOptions?.[0]?.id;
  const [selectedServingId, setSelectedServingId] = useState<string | undefined>(defaultServingId);
  const selectedFood = useMemo(
    () => applyServingOption(food, selectedServingId),
    [food, selectedServingId],
  );

  return (
    <AddFoodPanelContent
      food={selectedFood}
      key={selectedServingId ?? 'default-serving'}
      onAdded={onAdded}
      onServingChange={setSelectedServingId}
      selectedServingId={selectedServingId}
      sourceFood={food}
      userId={userId}
    />
  );
}

function AddFoodPanelContent({
  food,
  onAdded,
  onServingChange,
  selectedServingId,
  sourceFood,
  userId,
}: AddFoodPanelProps & {
  onServingChange: (servingId: string) => void;
  selectedServingId: string | undefined;
  sourceFood: Food;
}) {
  const addFood = useAddFoodToDiary({
    food,
    onAdded,
    userId,
  });

  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.kicker}>Add to Diary</Text>
        <Text style={styles.title}>{food.name}</Text>
        {food.brand ? <Text style={styles.meta}>{food.brand}</Text> : null}
      </View>

      <View style={styles.servingBox}>
        <Text style={styles.label}>Serving size</Text>
        <Text style={styles.value}>{formatServing(food)}</Text>
        <Text style={styles.meta}>{formatBasis(food)}</Text>
        {food.servingsPerContainer ? (
          <Text style={styles.meta}>
            Servings per container: {formatNutritionValue(food.servingsPerContainer)}
          </Text>
        ) : null}
        {sourceFood.servingOptions && sourceFood.servingOptions.length > 1 ? (
          <View style={styles.servingOptions}>
            <Text style={styles.label}>FatSecret serving options</Text>
            {sourceFood.servingOptions.map((option) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedServingId === option.id }}
                key={option.id}
                onPress={() => onServingChange(option.id)}
                style={({ pressed }) => [
                  styles.servingOptionButton,
                  selectedServingId === option.id && styles.servingOptionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.servingOptionText,
                    selectedServingId === option.id && styles.servingOptionTextSelected,
                  ]}
                >
                  {option.servingDescription ??
                    `${option.servingSize ?? 1} ${option.servingUnit ?? 'serving'}`}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {addFood.totalServingAmount !== null && addFood.totalServingUnit ? (
          <Text style={styles.meta}>
            Total amount: {formatNutritionValue(addFood.totalServingAmount)}{' '}
            {addFood.totalServingUnit}
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Meal</Text>
        <View style={styles.mealGrid}>
          {MEAL_TYPES.map((mealType) => (
            <MealButton
              key={mealType}
              mealType={mealType}
              onPress={() => addFood.setMealType(mealType)}
              selected={addFood.mealType === mealType}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.quantityRow}>
          <QuantityButton label="-" onPress={addFood.decrementItemQuantity} />
          <TextInput
            accessibilityLabel="Item quantity"
            keyboardType="decimal-pad"
            onChangeText={addFood.setItemQuantityText}
            style={styles.quantityInput}
            value={addFood.itemQuantityText}
          />
          <QuantityButton label="+" onPress={addFood.incrementItemQuantity} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Portion</Text>
        <View style={styles.quantityRow}>
          <QuantityButton label="-" onPress={addFood.decrementQuantity} />
          <TextInput
            accessibilityLabel="Amount eaten"
            keyboardType="decimal-pad"
            onChangeText={addFood.setQuantityText}
            style={styles.quantityInput}
            value={addFood.quantityText}
          />
          <QuantityButton label="+" onPress={addFood.incrementQuantity} />
        </View>
        <View style={styles.unitGrid}>
          {addFood.portionUnitOptions.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: addFood.portionUnit === option.unit }}
              key={option.unit}
              onPress={() => addFood.setPortionUnit(option.unit)}
              style={({ pressed }) => [
                styles.unitButton,
                addFood.portionUnit === option.unit && styles.unitButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  addFood.portionUnit === option.unit && styles.unitButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.meta}>
          Each: {addFood.quantityText} {addFood.portionUnit}
        </Text>
        <Text style={styles.meta}>
          Equivalent: {formatNutritionValue(addFood.preview.servingEquivalent)} total serving
          {addFood.preview.servingEquivalent === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.previewGrid}>
        <PreviewMetric label="Calories" value={formatNutritionValue(addFood.preview.calories)} />
        <PreviewMetric
          label="Protein"
          value={`${formatNutritionValue(addFood.preview.proteinG)}g`}
        />
        <PreviewMetric label="Carbs" value={`${formatNutritionValue(addFood.preview.carbsG)}g`} />
        <PreviewMetric label="Fat" value={`${formatNutritionValue(addFood.preview.fatG)}g`} />
      </View>

      {addFood.errorMessage ? <AuthMessage message={addFood.errorMessage} tone="error" /> : null}

      <Pressable
        accessibilityRole="button"
        disabled={addFood.isSaving}
        onPress={addFood.save}
        style={({ pressed }) => [
          styles.addButton,
          addFood.isSaving && styles.disabled,
          pressed && !addFood.isSaving && styles.pressed,
        ]}
      >
        <Text style={styles.addButtonText}>{addFood.isSaving ? 'Adding Food' : 'Add Food'}</Text>
      </Pressable>
    </View>
  );
}

function applyServingOption(food: Food, servingId: string | undefined): Food {
  const selectedServing = food.servingOptions?.find((option) => option.id === servingId);

  if (!selectedServing) {
    return food;
  }

  return {
    ...food,
    servingSize: selectedServing.servingSize,
    servingUnit: selectedServing.servingUnit,
    servingDescription: selectedServing.servingDescription,
    servingBasis: selectedServing.servingBasis,
    servingCalories: selectedServing.calories,
    servingProteinG: selectedServing.proteinG,
    servingCarbsG: selectedServing.carbsG,
    servingFatG: selectedServing.fatG,
    servingFiberG: selectedServing.fiberG,
    servingSugarG: selectedServing.sugarG,
    servingSodiumMg: selectedServing.sodiumMg,
    calories: selectedServing.calories,
    proteinG: selectedServing.proteinG,
    carbsG: selectedServing.carbsG,
    fatG: selectedServing.fatG,
    fiberG: selectedServing.fiberG,
    sugarG: selectedServing.sugarG,
    sodiumMg: selectedServing.sodiumMg,
  };
}

function MealButton({
  mealType,
  onPress,
  selected,
}: {
  mealType: MealType;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mealButton,
        selected && styles.mealButtonSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.mealButtonText, selected && styles.mealButtonTextSelected]}>
        {MEAL_LABELS[mealType]}
      </Text>
    </Pressable>
  );
}

function QuantityButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}
    >
      <Text style={styles.quantityButtonText}>{label}</Text>
    </Pressable>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewMetric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function formatServing(food: Food): string {
  if (food.servingDescription) {
    return food.servingDescription;
  }

  if (food.servingSize && food.servingUnit) {
    return `${formatNutritionValue(food.servingSize)} ${food.servingUnit}`;
  }

  return 'Serving size unavailable';
}

function formatBasis(food: Food): string {
  if (food.servingBasis === 'per_serving') {
    return food.servingSize && food.servingUnit
      ? `Nutrition per serving (${formatNutritionValue(food.servingSize)} ${food.servingUnit})`
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
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  kicker: {
    color: '#1f8a5b',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    marginTop: 4,
  },
  meta: {
    color: '#526057',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  servingBox: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    gap: 4,
    padding: 14,
  },
  servingOptions: {
    gap: 8,
    marginTop: 8,
  },
  servingOptionButton: {
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  servingOptionSelected: {
    backgroundColor: '#1f8a5b',
    borderColor: '#1f8a5b',
  },
  servingOptionText: {
    color: '#526057',
    fontSize: 14,
    fontWeight: '900',
  },
  servingOptionTextSelected: {
    color: '#ffffff',
  },
  section: {
    gap: 10,
  },
  label: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  value: {
    color: '#17211b',
    fontSize: 18,
    fontWeight: '900',
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  mealButtonSelected: {
    backgroundColor: '#1f8a5b',
    borderColor: '#1f8a5b',
  },
  mealButtonText: {
    color: '#526057',
    fontSize: 14,
    fontWeight: '900',
  },
  mealButtonTextSelected: {
    color: '#ffffff',
  },
  quantityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: '#eaf2ec',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  quantityButtonText: {
    color: '#17211b',
    fontSize: 24,
    fontWeight: '900',
  },
  quantityInput: {
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#17211b',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    minHeight: 48,
    paddingHorizontal: 14,
    textAlign: 'center',
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 58,
    paddingHorizontal: 10,
  },
  unitButtonSelected: {
    backgroundColor: '#1f8a5b',
    borderColor: '#1f8a5b',
  },
  unitButtonText: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '900',
  },
  unitButtonTextSelected: {
    color: '#ffffff',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewMetric: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  metricValue: {
    color: '#17211b',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#1f8a5b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
