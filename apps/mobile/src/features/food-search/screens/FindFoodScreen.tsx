import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/design/components';
import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AddFoodPanel } from '@/features/diary/components/AddFoodPanel';
import { useFoodLibrary } from '@/features/saved-meals/hooks/useFoodLibrary';

import { FoodDetail } from '../components/FoodDetail';
import { useFindFood } from '../hooks/useFindFood';
import type {
  FoodSearchMode,
  FoodSearchResult,
  ProviderLookupSource,
} from '../types/foodSearchTypes';
import { mapFoodSearchResultToFood } from '../utils/foodSearchMapping';

const MODE_LABELS: Record<FoodSearchMode, string> = {
  search: 'Search',
  barcode: 'Barcode',
  'provider-id': 'Product ID',
};

const PROVIDER_LABELS: Record<ProviderLookupSource, string> = {
  fatsecret: 'FatSecret',
  usda: 'USDA FoodData Central',
};

export function FindFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { user } = useAuth();
  const initialMode: FoodSearchMode = params.mode === 'barcode' ? 'barcode' : 'search';
  const findFood = useFindFood(undefined, user?.id, initialMode);
  const library = useFoodLibrary({ userId: user?.id });
  const [foodBeingAdded, setFoodBeingAdded] = useState<FoodSearchResult | null>(null);
  const showFoodLibrary =
    findFood.mode === 'search' &&
    findFood.query.trim().length === 0 &&
    !findFood.selectedFood &&
    !foodBeingAdded;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityLabel="Back to dashboard"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <AppIcon color={colors.textPrimary} name="chevron-back" />
          <Text style={styles.backText}>Today</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/saved-meals')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Saved Meals</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/manual-food')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Create Custom Food</Text>
        </Pressable>

        <View>
          <Text style={styles.kicker}>Food Lookup</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Find Food
          </Text>
        </View>

        <View style={styles.segmentedControl}>
          {(Object.keys(MODE_LABELS) as FoodSearchMode[]).map((mode) => {
            const selected = findFood.mode === mode;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={mode}
                onPress={() => findFood.setMode(mode)}
                style={({ pressed }) => [
                  styles.segment,
                  selected && styles.segmentSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {MODE_LABELS[mode]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {findFood.mode === 'search' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Search Foods</Text>
            <TextInput
              accessibilityLabel="Search foods"
              autoCapitalize="none"
              onChangeText={findFood.setQuery}
              onSubmitEditing={() => void findFood.search()}
              placeholder="chicken breast"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              returnKeyType="search"
              style={styles.input}
              value={findFood.query}
            />
            {findFood.autocompleteSuggestions.length > 0 ? (
              <View style={styles.suggestionList}>
                {findFood.autocompleteSuggestions.map((suggestion) => (
                  <Pressable
                    accessibilityRole="button"
                    key={suggestion}
                    onPress={() => findFood.setQuery(suggestion)}
                    style={({ pressed }) => [styles.suggestionButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
                <Text style={styles.attributionText}>Autocomplete powered by FatSecret</Text>
              </View>
            ) : null}
            <PrimaryButton
              disabled={findFood.isLoading}
              label={findFood.isLoading ? 'Searching' : 'Search'}
              onPress={findFood.search}
            />
          </View>
        ) : null}

        {findFood.mode === 'barcode' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Quick Lookup</Text>
            <TextInput
              accessibilityLabel="Enter Barcode"
              keyboardType="number-pad"
              onChangeText={findFood.setBarcode}
              placeholder="012345678905"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              style={styles.input}
              value={findFood.barcode}
            />
            <PrimaryButton
              disabled={findFood.isLoading}
              label={findFood.isLoading ? 'Looking Up' : 'Find Barcode'}
              onPress={findFood.lookupBarcode}
            />
          </View>
        ) : null}

        {findFood.mode === 'provider-id' ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Advanced</Text>
            <Text style={styles.inputLabel}>Provider</Text>
            <View style={styles.providerGrid}>
              {(Object.keys(PROVIDER_LABELS) as ProviderLookupSource[]).map((provider) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: findFood.provider === provider }}
                  key={provider}
                  onPress={() => findFood.setProvider(provider)}
                  style={({ pressed }) => [
                    styles.providerButton,
                    findFood.provider === provider && styles.providerButtonSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.providerText,
                      findFood.provider === provider && styles.providerTextSelected,
                    ]}
                  >
                    {PROVIDER_LABELS[provider]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              accessibilityLabel="Product or FDC ID"
              keyboardType="number-pad"
              onChangeText={findFood.setExternalId}
              placeholder={findFood.provider === 'fatsecret' ? 'FatSecret Food ID' : '2646170'}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.accent}
              style={styles.input}
              value={findFood.externalId}
            />
            <PrimaryButton
              disabled={findFood.isLoading}
              label={findFood.isLoading ? 'Finding Product' : 'Find Product'}
              onPress={findFood.lookupProviderId}
            />
          </View>
        ) : null}

        {findFood.errorMessage ? (
          <AuthMessage message={findFood.errorMessage} tone="error" />
        ) : null}
        {library.errorMessage ? <AuthMessage message={library.errorMessage} tone="error" /> : null}
        {library.message ? <AuthMessage message={library.message} tone="success" /> : null}

        {findFood.status === 'loading' ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>Updating food results...</Text>
          </View>
        ) : null}

        {findFood.correctedQuery && findFood.results.length > 0 && !findFood.selectedFood ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>Showing matches for {findFood.correctedQuery}.</Text>
          </View>
        ) : null}

        {findFood.status === 'empty' ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>No matching foods found.</Text>
          </View>
        ) : null}

        {findFood.results.some((food) => food.source === 'fatsecret') ? (
          <Text style={styles.attributionText}>Nutrition data from FatSecret.</Text>
        ) : null}

        {showFoodLibrary && library.favorites.length > 0 ? (
          <View style={styles.results}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            {library.favorites.map((favorite) => (
              <FoodResultCard
                food={favorite.food}
                key={favorite.id}
                onFavorite={() => {
                  void library.deleteFavorite(favorite.id);
                }}
                onPress={() => {
                  setFoodBeingAdded(null);
                  findFood.selectFood(favorite.food);
                }}
                secondaryActionLabel="Remove"
              />
            ))}
          </View>
        ) : null}

        {showFoodLibrary && library.savedMeals.length > 0 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Saved Meals</Text>
            <Text style={styles.stateText}>
              {library.savedMeals.length} saved meal
              {library.savedMeals.length === 1 ? '' : 's'} ready to log.
            </Text>
            <PrimaryButton
              disabled={false}
              label="Open Saved Meals"
              onPress={() => router.push('/saved-meals')}
            />
          </View>
        ) : null}

        {findFood.results.length > 0 && !findFood.selectedFood ? (
          <View style={styles.results}>
            <Text style={styles.sectionTitle}>{findFood.query.trim() ? 'Results' : 'Recent'}</Text>
            {findFood.results.map((food) => (
              <FoodResultCard
                food={food}
                key={`${food.source}:${food.externalId}`}
                onFavorite={() => {
                  void library.addFavorite(food);
                }}
                onPress={() => {
                  setFoodBeingAdded(null);
                  findFood.selectFood(food);
                }}
              />
            ))}
          </View>
        ) : null}

        {foodBeingAdded ? (
          <View style={styles.addFoodSection}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setFoodBeingAdded(null)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Back to Food</Text>
            </Pressable>
            <AddFoodPanel
              food={mapFoodSearchResultToFood(foodBeingAdded)}
              onAdded={() => router.replace('/diary')}
              userId={user?.id}
            />
          </View>
        ) : null}

        {findFood.selectedFood && !foodBeingAdded ? (
          <FoodDetail
            food={findFood.selectedFood}
            message={findFood.addToDiaryMessage}
            onAddToDiary={() => setFoodBeingAdded(findFood.selectedFood)}
            onBack={() => {
              setFoodBeingAdded(null);
              findFood.clearSelection();
            }}
            onFavorite={() => {
              if (findFood.selectedFood) {
                void library.addFavorite(findFood.selectedFood);
              }
            }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
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

function FoodResultCard({
  food,
  onFavorite,
  onPress,
  secondaryActionLabel = 'Favorite',
}: {
  food: FoodSearchResult;
  onFavorite: () => void;
  onPress: () => void;
  secondaryActionLabel?: string;
}) {
  return (
    <View style={styles.resultCard}>
      <Pressable
        accessibilityLabel={`View ${food.name}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.resultContent, pressed && styles.pressed]}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.sourceBadge}>{food.sourceLabel}</Text>
        </View>
        {food.brand ? <Text style={styles.foodMeta}>{food.brand}</Text> : null}
        <Text style={styles.foodMeta}>
          {formatServing(food)} · {food.calories.toLocaleString('en-US')} kcal
        </Text>
        <Text style={styles.foodMacros}>
          P {food.proteinG}g · C {food.carbsG}g · F {food.fatG}g
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onFavorite}
        style={({ pressed }) => [styles.cardActionButton, pressed && styles.pressed]}
      >
        <Text style={styles.cardActionText}>{secondaryActionLabel}</Text>
      </Pressable>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  backText: {
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
  segmentedControl: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.xxs,
    padding: spacing.xxs,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.small,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentSelected: {
    backgroundColor: colors.surfaceInteractive,
  },
  segmentText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  segmentTextSelected: {
    color: colors.accent,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  panelTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  input: {
    ...typography.bodyStrong,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.textPrimary,
    minHeight: controlHeights.large,
    paddingHorizontal: spacing.sm,
  },
  providerGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  providerButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  providerButtonSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  providerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  providerTextSelected: {
    color: colors.accent,
  },
  suggestionList: {
    gap: spacing.xs,
  },
  suggestionButton: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.medium,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  suggestionText: {
    ...typography.secondary,
    color: colors.textPrimary,
  },
  attributionText: {
    ...typography.micro,
    color: colors.textMuted,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyStrong,
    color: colors.accentText,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: controlHeights.compact,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  results: {
    gap: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md,
  },
  resultContent: {
    gap: spacing.xs,
  },
  cardActionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceInteractive,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.compact,
    paddingHorizontal: spacing.sm,
  },
  cardActionText: {
    ...typography.caption,
    color: colors.accent,
  },
  resultHeader: {
    gap: 8,
  },
  foodName: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  sourceBadge: {
    ...typography.micro,
    alignSelf: 'flex-start',
    backgroundColor: colors.informationMuted,
    borderRadius: radii.capsule,
    color: colors.information,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    textTransform: 'uppercase',
  },
  foodMeta: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  foodMacros: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  addFoodSection: {
    gap: spacing.sm,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  stateText: {
    ...typography.secondary,
    color: colors.textSecondary,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
});
