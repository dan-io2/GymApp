import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
          <Text style={styles.backText}>Back Home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/saved-meals')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>Saved Meals</Text>
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
              placeholderTextColor="#7a877d"
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
              placeholderTextColor="#7a877d"
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
              placeholderTextColor="#7a877d"
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
    backgroundColor: '#f7f8f3',
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
  backText: {
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
  segmentedControl: {
    backgroundColor: '#eaf2ec',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    padding: 6,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  segmentSelected: {
    backgroundColor: '#ffffff',
  },
  segmentText: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '900',
  },
  segmentTextSelected: {
    color: '#17211b',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  panelTitle: {
    color: '#17211b',
    fontSize: 20,
    fontWeight: '900',
  },
  inputLabel: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#17211b',
    fontSize: 17,
    fontWeight: '800',
    minHeight: 54,
    paddingHorizontal: 14,
  },
  providerGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  providerButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 10,
  },
  providerButtonSelected: {
    backgroundColor: '#1f8a5b',
    borderColor: '#1f8a5b',
  },
  providerText: {
    color: '#526057',
    fontSize: 14,
    fontWeight: '800',
  },
  providerTextSelected: {
    color: '#ffffff',
  },
  suggestionList: {
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  suggestionText: {
    color: '#17211b',
    fontSize: 15,
    fontWeight: '800',
  },
  attributionText: {
    color: '#617067',
    fontSize: 12,
    fontWeight: '800',
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
  sectionTitle: {
    color: '#17211b',
    fontSize: 20,
    fontWeight: '900',
  },
  results: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  resultContent: {
    gap: 8,
  },
  cardActionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eaf2ec',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  cardActionText: {
    color: '#1f7a54',
    fontSize: 13,
    fontWeight: '900',
  },
  resultHeader: {
    gap: 8,
  },
  foodName: {
    color: '#17211b',
    fontSize: 18,
    fontWeight: '900',
  },
  sourceBadge: {
    color: '#1f8a5b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  foodMeta: {
    color: '#526057',
    fontSize: 14,
    fontWeight: '700',
  },
  foodMacros: {
    color: '#17211b',
    fontSize: 14,
    fontWeight: '900',
  },
  addFoodSection: {
    gap: 12,
  },
  stateCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  stateText: {
    color: '#526057',
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.82,
  },
});
