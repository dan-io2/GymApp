import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppCard, SectionHeader } from '@/design/components';
import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AddFoodPanel } from '@/features/diary/components/AddFoodPanel';
import { mapFoodSearchResultToFood } from '@/features/food-search/utils/foodSearchMapping';
import type { FoodSearchResult } from '@/features/food-search/types/foodSearchTypes';

import { manualFoodService } from '../services/manualFoodService';

type FormField =
  'name' | 'servingAmount' | 'servingUnit' | 'calories' | 'proteinG' | 'carbsG' | 'fatG';

const INITIAL_FORM: Record<FormField, string> = {
  name: '',
  servingAmount: '1',
  servingUnit: 'serving',
  calories: '',
  proteinG: '',
  carbsG: '',
  fatG: '',
};

export function ManualFoodScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [food, setFood] = useState<FoodSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setField(field: FormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate() {
    if (!user?.id || saving) return;
    setSaving(true);
    setError(null);
    try {
      setFood(
        await manualFoodService.create(user.id, {
          name: form.name,
          servingAmount: Number(form.servingAmount),
          servingUnit: form.servingUnit,
          calories: Number(form.calories),
          proteinG: Number(form.proteinG),
          carbsG: Number(form.carbsG),
          fatG: Number(form.fatG),
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create custom food.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View>
          <Text style={styles.kicker}>Custom Food</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Create Food
          </Text>
        </View>
        {!food ? (
          <View style={styles.form}>
            <View style={styles.group}>
              <SectionHeader subtitle="Name and serving basis" title="Food" />
              <AppCard style={styles.panel}>
                <Field
                  label="Food name"
                  value={form.name}
                  onChange={(value) => setField('name', value)}
                />
                <View style={styles.fieldRow}>
                  <View style={styles.halfField}>
                    <Field
                      label="Serving amount"
                      value={form.servingAmount}
                      onChange={(value) => setField('servingAmount', value)}
                      numeric
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Field
                      label="Serving unit"
                      value={form.servingUnit}
                      onChange={(value) => setField('servingUnit', value)}
                    />
                  </View>
                </View>
              </AppCard>
            </View>
            <View style={styles.group}>
              <SectionHeader subtitle="Values for one serving" title="Nutrition" />
              <AppCard style={styles.panel}>
                <Field
                  label="Calories"
                  value={form.calories}
                  onChange={(value) => setField('calories', value)}
                  numeric
                />
                <View style={styles.fieldRow}>
                  <View style={styles.thirdField}>
                    <Field
                      label="Protein (g)"
                      value={form.proteinG}
                      onChange={(value) => setField('proteinG', value)}
                      numeric
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <Field
                      label="Carbs (g)"
                      value={form.carbsG}
                      onChange={(value) => setField('carbsG', value)}
                      numeric
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <Field
                      label="Fat (g)"
                      value={form.fatG}
                      onChange={(value) => setField('fatG', value)}
                      numeric
                    />
                  </View>
                </View>
              </AppCard>
            </View>
            <AppButton
              label="Save Custom Food"
              loading={saving}
              onPress={() => void handleCreate()}
            />
          </View>
        ) : (
          <AddFoodPanel
            food={mapFoodSearchResultToFood(food)}
            onAdded={() => router.replace('/diary')}
            userId={user?.id}
          />
        )}
        {error ? <AuthMessage message={error} tone="error" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        onChangeText={onChange}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.lg },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  backText: { ...typography.caption, color: colors.textPrimary },
  kicker: { ...typography.caption, color: colors.accent, textTransform: 'uppercase' },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.xxs },
  form: { gap: spacing.lg },
  group: { gap: spacing.sm },
  panel: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  halfField: { flex: 1 },
  thirdField: { flexBasis: '47%', flexGrow: 1, minWidth: 112 },
  field: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary },
  input: {
    ...typography.body,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.textPrimary,
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.sm,
  },
});
