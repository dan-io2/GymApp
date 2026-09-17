import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/design/components';
import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
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
          <EmptyState
            icon="restaurant-outline"
            message="Save a meal from your diary to log the whole combination again in one tap."
            title="No saved meals yet"
          />
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
  const [isLogging, setIsLogging] = useState(false);
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
            disabled={isLogging}
            onPress={async () => {
              if (isLogging) {
                return;
              }

              setIsLogging(true);

              try {
                await onLog({ mealId: meal.id, mealType, multiplier });
              } finally {
                setIsLogging(false);
              }
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              isLogging && styles.disabled,
              pressed && !isLogging && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{isLogging ? 'Logging Meal' : 'Log Meal'}</Text>
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
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  kicker: {
    ...typography.caption,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.screenTitle,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardTitleWrap: {
    flex: 1,
    gap: spacing.xxs,
  },
  cardTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  mutedText: {
    ...typography.secondary,
    color: colors.textMuted,
  },
  expandText: {
    ...typography.caption,
    color: colors.accent,
  },
  detail: {
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  items: {
    gap: spacing.xs,
  },
  itemRow: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  itemText: {
    gap: spacing.xxs,
  },
  itemName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  ghostButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceInteractive,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  ghostButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optionGroup: {
    gap: spacing.xs,
  },
  optionLabel: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionPill: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  optionPillSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  optionPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optionPillTextSelected: {
    color: colors.accent,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.sm,
  },
  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
  disabled: {
    opacity: 0.55,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  dangerButtonText: {
    ...typography.caption,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.82,
  },
});
