import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  MEAL_LABELS,
  MEAL_TYPES,
  formatNutritionValue,
} from '@/features/diary/utils/foodDiaryUtils';

import { useFoodLibrary } from '../hooks/useFoodLibrary';
import type { SavedMeal, SavedMealMultiplier } from '../types/savedMealTypes';

const MULTIPLIERS: SavedMealMultiplier[] = [0.5, 1, 2];

export function SavedMealsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const library = useFoodLibrary({ userId: user?.id });
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const selectedMeal = useMemo(
    () => library.savedMeals.find((meal) => meal.id === selectedMealId) ?? null,
    [library.savedMeals, selectedMealId],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/diary')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>Back to Diary</Text>
        </Pressable>

        <View>
          <Text style={styles.kicker}>Food Library</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Saved Meals
          </Text>
        </View>

        {library.errorMessage ? <AuthMessage message={library.errorMessage} tone="error" /> : null}
        {library.message ? <AuthMessage message={library.message} tone="success" /> : null}

        {library.isLoading ? (
          <View style={styles.card}>
            <Text style={styles.mutedText}>Loading saved meals...</Text>
          </View>
        ) : null}

        {!library.isLoading && library.savedMeals.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No saved meals yet</Text>
            <Text style={styles.mutedText}>Save a meal from today&apos;s diary first.</Text>
          </View>
        ) : null}

        {library.savedMeals.map((meal) => (
          <SavedMealCard
            key={meal.id}
            meal={meal}
            onDelete={() => {
              Alert.alert('Delete saved meal?', 'This will not delete diary history.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    void library.deleteSavedMeal(meal.id);
                  },
                },
              ]);
            }}
            onLog={library.logSavedMeal}
            onRemoveItem={(itemId) => {
              void library.removeSavedMealItem(itemId);
            }}
            onRename={library.renameSavedMeal}
            selected={selectedMeal?.id === meal.id}
            setSelected={() => setSelectedMealId(selectedMeal?.id === meal.id ? null : meal.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedMealCard({
  meal,
  onDelete,
  onLog,
  onRemoveItem,
  onRename,
  selected,
  setSelected,
}: {
  meal: SavedMeal;
  onDelete: () => void;
  onLog: (input: {
    mealId: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    multiplier: SavedMealMultiplier;
  }) => Promise<boolean>;
  onRemoveItem: (itemId: string) => void;
  onRename: (input: { mealId: string; name: string }) => Promise<boolean>;
  selected: boolean;
  setSelected: () => void;
}) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [multiplier, setMultiplier] = useState<SavedMealMultiplier>(1);
  const [name, setName] = useState(meal.name);
  const totals = meal.items.reduce(
    (current, item) => ({
      calories: current.calories + item.calories,
      carbsG: current.carbsG + item.carbsG,
      fatG: current.fatG + item.fatG,
      proteinG: current.proteinG + item.proteinG,
    }),
    { calories: 0, carbsG: 0, fatG: 0, proteinG: 0 },
  );

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={setSelected} style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{meal.name}</Text>
          <Text style={styles.mutedText}>
            {meal.items.length} item{meal.items.length === 1 ? '' : 's'} •{' '}
            {formatNutritionValue(totals.calories)} kcal
          </Text>
        </View>
        <Text style={styles.expandText}>{selected ? 'Close' : 'Open'}</Text>
      </Pressable>

      {selected ? (
        <View style={styles.detail}>
          <TextInput
            accessibilityLabel={`Rename ${meal.name}`}
            onChangeText={setName}
            style={styles.input}
            value={name}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onRename({ mealId: meal.id, name });
            }}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Rename</Text>
          </Pressable>

          <View style={styles.items}>
            {meal.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemText}>
                  <Text style={styles.itemName}>{item.foodName}</Text>
                  {item.brand ? <Text style={styles.mutedText}>{item.brand}</Text> : null}
                  <Text style={styles.mutedText}>
                    {formatNutritionValue(item.calories)} kcal • P{' '}
                    {formatNutritionValue(item.proteinG)}g • C {formatNutritionValue(item.carbsG)}g
                    • F {formatNutritionValue(item.fatG)}g
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onRemoveItem(item.id)}
                  style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
                >
                  <Text style={styles.ghostButtonText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Meal</Text>
            <View style={styles.optionGrid}>
              {MEAL_TYPES.map((nextMealType) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: mealType === nextMealType }}
                  key={nextMealType}
                  onPress={() => setMealType(nextMealType)}
                  style={({ pressed }) => [
                    styles.optionPill,
                    mealType === nextMealType && styles.optionPillSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionPillText,
                      mealType === nextMealType && styles.optionPillTextSelected,
                    ]}
                  >
                    {MEAL_LABELS[nextMealType]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Amount</Text>
            <View style={styles.optionGrid}>
              {MULTIPLIERS.map((nextMultiplier) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: multiplier === nextMultiplier }}
                  key={nextMultiplier}
                  onPress={() => setMultiplier(nextMultiplier)}
                  style={({ pressed }) => [
                    styles.optionPill,
                    multiplier === nextMultiplier && styles.optionPillSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionPillText,
                      multiplier === nextMultiplier && styles.optionPillTextSelected,
                    ]}
                  >
                    {nextMultiplier}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onLog({ mealId: meal.id, mealType, multiplier });
            }}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Log Meal</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
          >
            <Text style={styles.dangerButtonText}>Delete Saved Meal</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f8f3',
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '900',
  },
  kicker: {
    color: '#1f8a5b',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#17211b',
    fontSize: 22,
    fontWeight: '900',
  },
  mutedText: {
    color: '#617067',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  expandText: {
    color: '#1f8a5b',
    fontSize: 14,
    fontWeight: '900',
  },
  detail: {
    gap: 12,
  },
  input: {
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#17211b',
    fontSize: 17,
    fontWeight: '800',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '900',
  },
  items: {
    gap: 10,
  },
  itemRow: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    gap: 10,
    padding: 12,
  },
  itemText: {
    gap: 4,
  },
  itemName: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '900',
  },
  ghostButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eaf2ec',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  ghostButtonText: {
    color: '#1f7a54',
    fontSize: 14,
    fontWeight: '900',
  },
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  optionPillSelected: {
    backgroundColor: '#123026',
    borderColor: '#123026',
  },
  optionPillText: {
    color: '#1f7a54',
    fontSize: 13,
    fontWeight: '900',
  },
  optionPillTextSelected: {
    color: '#ffffff',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1f8a5b',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  dangerButton: {
    alignItems: 'center',
    borderColor: '#efbbb5',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  dangerButtonText: {
    color: '#a44337',
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.82,
  },
});
