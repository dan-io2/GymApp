import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardLoading } from '@/features/dashboard/components/DashboardLoading';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { useFoodLibrary } from '@/features/saved-meals/hooks/useFoodLibrary';

import { useDailyDiary } from '../hooks/useDailyDiary';
import type { FoodLog, MealGroup, MealType, NutritionProgress } from '../types/foodTypes';
import {
  MEAL_LABELS,
  MEAL_TYPES,
  calculateTotalServingAmount,
  formatNutritionValue,
  formatQuantity,
} from '../utils/foodDiaryUtils';
import {
  formatPortionAmount,
  formatPortionUnit,
  getPortionUnitOptions,
  parsePortionAmount,
} from '../utils/portionUtils';

export function DiaryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const today = useMemo(() => new Date(), []);
  const dashboard = useDashboardData(user?.id);
  const library = useFoodLibrary({ userId: user?.id });
  const [reloggingLogId, setReloggingLogId] = useState<string | null>(null);
  const activeGoal = dashboard.data?.activeGoal ?? null;
  const diary = useDailyDiary({
    date: today,
    targets: activeGoal
      ? {
          dailyCalories: activeGoal.dailyCalories,
          proteinG: activeGoal.proteinG,
          carbsG: activeGoal.carbsG,
          fatG: activeGoal.fatG,
        }
      : null,
    userId: user?.id,
  });
  const refetchDiary = diary.refetch;
  const refetchDashboard = dashboard.refetch;

  useFocusEffect(
    useCallback(() => {
      void refetchDiary();
      void refetchDashboard();
    }, [refetchDashboard, refetchDiary]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void diary.refetch();
              void dashboard.refetch();
            }}
            refreshing={diary.isRefreshing || dashboard.isRefreshing}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Today</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {formatDiaryDate(today)}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <Text style={styles.headerButtonText}>Go Home</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/saved-meals')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <Text style={styles.headerButtonText}>Saved Meals</Text>
            </Pressable>
          </View>
        </View>

        {diary.isLoading || dashboard.isLoading ? <DashboardLoading /> : null}

        {diary.errorMessage ? <AuthMessage message={diary.errorMessage} tone="error" /> : null}
        {library.errorMessage ? <AuthMessage message={library.errorMessage} tone="error" /> : null}
        {library.message ? <AuthMessage message={library.message} tone="success" /> : null}
        {dashboard.errorMessage ? (
          <AuthMessage message={dashboard.errorMessage} tone="error" />
        ) : null}

        {activeGoal && diary.progress ? <DailyProgress progress={diary.progress} /> : null}

        {diary.status === 'success' ? (
          <View style={styles.mealList}>
            {diary.mealGroups.map((group) => (
              <MealSection
                deletingLogId={diary.deletingLogId}
                group={group}
                key={group.mealType}
                onAddFood={() => router.push('/find-food')}
                onDelete={(logId) => {
                  Alert.alert('Delete diary item?', 'This removes the food from today.', [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        void diary.deleteLog(logId);
                      },
                    },
                  ]);
                }}
                onLogAgain={(log) => {
                  if (reloggingLogId) {
                    return;
                  }

                  setReloggingLogId(log.id);
                  void library.logAgain(log).then((success) => {
                    setReloggingLogId(null);
                    if (success) {
                      void diary.refetch();
                      void dashboard.refetch();
                    }
                  });
                }}
                onSaveMeal={(name, logs) =>
                  library.createSavedMeal({
                    logs,
                    name,
                  })
                }
                onUpdate={diary.updateLog}
                savingLogId={diary.savingLogId}
                reloggingLogId={reloggingLogId}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DailyProgress({ progress }: { progress: NutritionProgress }) {
  return (
    <View style={styles.progressCard}>
      <ProgressLine label="Calories" progress={progress.calories} unit="kcal" />
      <ProgressLine label="Protein" progress={progress.protein} unit="g" />
      <ProgressLine label="Carbs" progress={progress.carbs} unit="g" />
      <ProgressLine label="Fat" progress={progress.fat} unit="g" />
    </View>
  );
}

function ProgressLine({
  label,
  progress,
  unit,
}: {
  label: string;
  progress: NutritionProgress[keyof NutritionProgress];
  unit: string;
}) {
  return (
    <View style={styles.progressLine}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {formatNutritionValue(progress.consumed)} / {formatNutritionValue(progress.target)} {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress.progressRatio * 100}%` }]} />
      </View>
      <Text style={styles.remainingText}>
        {progress.overage > 0
          ? `${formatNutritionValue(progress.overage)} ${unit} over`
          : `${formatNutritionValue(progress.remaining)} ${unit} remaining`}
      </Text>
    </View>
  );
}

function MealSection({
  deletingLogId,
  group,
  onAddFood,
  onDelete,
  onLogAgain,
  onSaveMeal,
  onUpdate,
  reloggingLogId,
  savingLogId,
}: {
  deletingLogId: string | null;
  group: MealGroup;
  onAddFood: () => void;
  onDelete: (logId: string) => void;
  onLogAgain: (log: FoodLog) => void;
  onSaveMeal: (name: string, logs: FoodLog[]) => Promise<boolean>;
  onUpdate: (input: {
    itemQuantity?: number;
    log: FoodLog;
    mealType: MealType;
    portionAmount?: number;
    portionUnit?: string;
    quantity: number;
  }) => Promise<boolean>;
  reloggingLogId: string | null;
  savingLogId: string | null;
}) {
  const [savingMeal, setSavingMeal] = useState(false);
  const [savingMealSubmit, setSavingMealSubmit] = useState(false);
  const [savedMealName, setSavedMealName] = useState(group.label);

  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealTitle}>{group.label}</Text>
        <Text style={styles.mealTotal}>
          {formatNutritionValue(group.totals.caloriesConsumed)} kcal
        </Text>
      </View>

      {group.logs.length === 0 ? (
        <View style={styles.emptyMeal}>
          <Text style={styles.emptyText}>No foods yet</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onAddFood}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>+ Add Food</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.mealActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onAddFood}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>+ Add Food</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSavingMeal((current) => !current)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Save as Meal</Text>
            </Pressable>
          </View>

          {savingMeal ? (
            <View style={styles.saveMealBox}>
              <TextInput
                accessibilityLabel={`Saved meal name for ${group.label}`}
                onChangeText={setSavedMealName}
                placeholder="Meal name"
                placeholderTextColor="#7a877d"
                style={styles.editInput}
                value={savedMealName}
              />
              <View style={styles.editActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSavingMeal(false)}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={savingMealSubmit}
                  onPress={() => {
                    setSavingMealSubmit(true);
                    void onSaveMeal(savedMealName, group.logs).then((success) => {
                      setSavingMealSubmit(false);
                      if (success) {
                        setSavingMeal(false);
                      }
                    });
                  }}
                  style={({ pressed }) => [
                    styles.saveButton,
                    savingMealSubmit && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.saveButtonText}>
                    {savingMealSubmit ? 'Saving Meal' : 'Save Meal'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.logList}>
            {group.logs.map((log) => (
              <DiaryLogItem
                deleting={deletingLogId === log.id}
                key={log.id}
                log={log}
                onDelete={() => onDelete(log.id)}
                onLogAgain={() => onLogAgain(log)}
                onUpdate={onUpdate}
                relogging={reloggingLogId === log.id}
                saving={savingLogId === log.id}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function DiaryLogItem({
  deleting,
  log,
  onDelete,
  onLogAgain,
  onUpdate,
  relogging,
  saving,
}: {
  deleting: boolean;
  log: FoodLog;
  onDelete: () => void;
  onLogAgain: () => void;
  onUpdate: (input: {
    itemQuantity?: number;
    log: FoodLog;
    mealType: MealType;
    portionAmount?: number;
    portionUnit?: string;
    quantity: number;
  }) => Promise<boolean>;
  relogging: boolean;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [itemQuantityText, setItemQuantityText] = useState(formatPortionAmount(log.itemQuantity));
  const [quantityText, setQuantityText] = useState(formatPortionAmount(log.portionAmount));
  const [portionUnit, setPortionUnit] = useState(log.portionUnit);
  const [mealType, setMealType] = useState<MealType>(log.mealType);
  const totalAmount = calculateTotalServingAmount({
    quantity: log.quantity,
    servingSize: log.servingSize,
  });
  const unitOptions = getPortionUnitOptions({
    servingBasis: log.servingSize === null ? 'unknown' : 'per_serving',
    servingDescription:
      log.servingSize && log.servingUnit ? `${log.servingSize} ${log.servingUnit}` : null,
    servingSize: log.servingSize,
    servingUnit: log.servingUnit,
  });

  return (
    <View style={styles.logItem}>
      <View style={styles.logTopRow}>
        <View style={styles.logText}>
          <Text style={styles.logName}>{log.foodName}</Text>
          {log.brand ? <Text style={styles.logMeta}>{log.brand}</Text> : null}
          <Text style={styles.logMeta}>
            {formatPortionAmount(log.itemQuantity)} x {formatPortionAmount(log.portionAmount)}{' '}
            {formatPortionUnit(log.portionUnit)} • {formatQuantity(log.servingEquivalent)} serving
            {log.servingEquivalent === 1 ? '' : 's'}
            {totalAmount !== null && log.servingUnit
              ? ` · ${formatNutritionValue(totalAmount)} ${log.servingUnit}`
              : ''}
          </Text>
        </View>
        <Text style={styles.logCalories}>{formatNutritionValue(log.calories)} kcal</Text>
      </View>

      {editing ? (
        <View style={styles.editBox}>
          <View style={styles.mealGrid}>
            {MEAL_TYPES.map((nextMealType) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: mealType === nextMealType }}
                key={nextMealType}
                onPress={() => setMealType(nextMealType)}
                style={({ pressed }) => [
                  styles.mealPill,
                  mealType === nextMealType && styles.mealPillSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.mealPillText,
                    mealType === nextMealType && styles.mealPillTextSelected,
                  ]}
                >
                  {MEAL_LABELS[nextMealType]}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel={`Item quantity for ${log.foodName}`}
            keyboardType="decimal-pad"
            onChangeText={setItemQuantityText}
            style={styles.editInput}
            value={itemQuantityText}
          />
          <TextInput
            accessibilityLabel={`Quantity for ${log.foodName}`}
            keyboardType="decimal-pad"
            onChangeText={setQuantityText}
            style={styles.editInput}
            value={quantityText}
          />
          <View style={styles.editActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setQuantityText(formatPortionAmount(log.portionAmount));
                setItemQuantityText(formatPortionAmount(log.itemQuantity));
                setPortionUnit(log.portionUnit);
                setMealType(log.mealType);
                setEditing(false);
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => {
                const amount = parsePortionAmount(quantityText);
                const nextItemQuantity = parsePortionAmount(itemQuantityText);

                if (amount !== null && nextItemQuantity !== null) {
                  void onUpdate({
                    itemQuantity: nextItemQuantity,
                    log,
                    mealType,
                    portionAmount: amount,
                    portionUnit,
                    quantity: amount,
                  }).then((success) => {
                    if (success) {
                      setEditing(false);
                    }
                  });
                }
              }}
              style={({ pressed }) => [
                styles.saveButton,
                saving && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving' : 'Save'}</Text>
            </Pressable>
          </View>
          <View style={styles.mealGrid}>
            {unitOptions.map((option) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: portionUnit === option.unit }}
                key={option.unit}
                onPress={() => setPortionUnit(option.unit)}
                style={({ pressed }) => [
                  styles.mealPill,
                  portionUnit === option.unit && styles.mealPillSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.mealPillText,
                    portionUnit === option.unit && styles.mealPillTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.logActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setEditing((current) => !current)}
          style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
        >
          <Text style={styles.smallButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={relogging}
          onPress={onLogAgain}
          style={({ pressed }) => [
            styles.smallButton,
            relogging && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.smallButtonText}>{relogging ? 'Logging' : 'Log Again'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={deleting}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.smallButton,
            deleting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.smallButtonText}>{deleting ? 'Deleting' : 'Delete'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatDiaryDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
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
  headerRow: {
    gap: 14,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kicker: {
    color: '#1f8a5b',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211b',
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 38,
    marginTop: 6,
  },
  headerButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  headerButtonText: {
    color: '#1f7a54',
    fontSize: 15,
    fontWeight: '900',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  progressLine: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#526057',
    fontSize: 15,
    fontWeight: '900',
  },
  progressValue: {
    color: '#17211b',
    fontSize: 15,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: '#e7ede8',
    borderRadius: 5,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#1f8a5b',
    borderRadius: 5,
    height: 10,
  },
  remainingText: {
    color: '#617067',
    fontSize: 13,
    fontWeight: '700',
  },
  mealList: {
    gap: 14,
  },
  mealActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  saveMealBox: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    gap: 10,
    padding: 12,
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce5de',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  mealHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTitle: {
    color: '#17211b',
    fontSize: 20,
    fontWeight: '900',
  },
  mealTotal: {
    color: '#1f8a5b',
    fontSize: 15,
    fontWeight: '900',
  },
  emptyMeal: {
    gap: 12,
  },
  emptyText: {
    color: '#617067',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#1f7a54',
    fontSize: 14,
    fontWeight: '900',
  },
  logList: {
    gap: 12,
  },
  logItem: {
    backgroundColor: '#f7f8f3',
    borderRadius: 8,
    gap: 12,
    padding: 12,
  },
  logTopRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  logText: {
    flex: 1,
    gap: 3,
  },
  logName: {
    color: '#17211b',
    fontSize: 16,
    fontWeight: '900',
  },
  logMeta: {
    color: '#617067',
    fontSize: 13,
    fontWeight: '700',
  },
  logCalories: {
    color: '#17211b',
    fontSize: 15,
    fontWeight: '900',
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#eaf2ec',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: '#1f7a54',
    fontSize: 13,
    fontWeight: '900',
  },
  editBox: {
    gap: 10,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealPill: {
    alignItems: 'center',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  mealPillSelected: {
    backgroundColor: '#1f8a5b',
    borderColor: '#1f8a5b',
  },
  mealPillText: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '900',
  },
  mealPillTextSelected: {
    color: '#ffffff',
  },
  editInput: {
    backgroundColor: '#ffffff',
    borderColor: '#cfd9d1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#17211b',
    fontSize: 17,
    fontWeight: '900',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#1f8a5b',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
