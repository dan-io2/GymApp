import { useCallback, useState } from 'react';
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

import { AppIcon, ProgressBar } from '@/design/components';
import { accents, colors, controlHeights, radii, spacing, typography } from '@/design/theme';
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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dashboard = useDashboardData(user?.id);
  const library = useFoodLibrary({ userId: user?.id });
  const [reloggingLogId, setReloggingLogId] = useState<string | null>(null);
  const activeGoal = dashboard.data?.activeGoal ?? null;
  const diary = useDailyDiary({
    date: selectedDate,
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
            <Text style={styles.kicker}>{isToday(selectedDate) ? 'Today' : 'Diary'}</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {formatDiaryDate(selectedDate)}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go Home"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <AppIcon color={colors.textSecondary} name="home-outline" />
            </Pressable>
            <Pressable
              accessibilityLabel="Saved Meals"
              accessibilityRole="button"
              onPress={() => router.push('/saved-meals')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <AppIcon color={colors.textSecondary} name="restaurant-outline" />
            </Pressable>
          </View>
        </View>

        <View style={styles.dateNavigation}>
          <Pressable
            accessibilityLabel="Previous day"
            accessibilityRole="button"
            onPress={() => setSelectedDate((current) => addDays(current, -1))}
            style={styles.dateButton}
          >
            <AppIcon color={colors.textPrimary} name="chevron-back" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelectedDate(new Date())}
            style={styles.todayButton}
          >
            <Text style={styles.todayText}>
              {isToday(selectedDate) ? 'Today' : 'Return to today'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Next day"
            accessibilityRole="button"
            accessibilityState={{ disabled: isToday(selectedDate) }}
            disabled={isToday(selectedDate)}
            onPress={() => setSelectedDate((current) => addDays(current, 1))}
            style={[styles.dateButton, isToday(selectedDate) && styles.disabled]}
          >
            <AppIcon color={colors.textPrimary} name="chevron-forward" />
          </Pressable>
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
  const accent = progressAccents[label];

  return (
    <View style={styles.progressLine}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {formatNutritionValue(progress.consumed)} / {formatNutritionValue(progress.target)} {unit}
        </Text>
      </View>
      <ProgressBar
        color={accent}
        overTarget={progress.overage > 0}
        progress={progress.progressRatio}
      />
      <Text style={[styles.remainingText, progress.overage > 0 && styles.overText]}>
        {progress.overage > 0
          ? `${formatNutritionValue(progress.overage)} ${unit} over`
          : `${formatNutritionValue(progress.remaining)} ${unit} remaining`}
      </Text>
    </View>
  );
}

const progressAccents: Record<string, string> = {
  Calories: accents.nutrition.foreground,
  Protein: accents.nutrition.foreground,
  Carbs: accents.carbohydrate.foreground,
  Fat: accents.fat.foreground,
};

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
                placeholderTextColor={colors.textMuted}
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
  const [actionsVisible, setActionsVisible] = useState(false);
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
        <View style={styles.logAside}>
          <Text style={styles.logCalories}>{formatNutritionValue(log.calories)} kcal</Text>
          <Pressable
            accessibilityLabel={`Actions for ${log.foodName}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: actionsVisible }}
            onPress={() => setActionsVisible((current) => !current)}
            style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
          >
            <AppIcon color={colors.textSecondary} name="ellipsis-horizontal" size={20} />
          </Pressable>
        </View>
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

      {actionsVisible ? (
        <View style={styles.logActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setEditing((current) => !current);
              setActionsVisible(false);
            }}
            style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
          >
            <Text style={styles.smallButtonText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={relogging}
            onPress={() => {
              setActionsVisible(false);
              onLogAgain();
            }}
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
            onPress={() => {
              setActionsVisible(false);
              onDelete();
            }}
            style={({ pressed }) => [
              styles.smallButton,
              deleting && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.deleteButtonText}>{deleting ? 'Deleting' : 'Delete'}</Text>
          </Pressable>
        </View>
      ) : null}
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

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
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
  headerButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.card,
    borderWidth: 1,
    justifyContent: 'center',
    height: controlHeights.compact,
    width: controlHeights.compact,
  },
  dateNavigation: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  dateButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  todayButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.medium,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  todayText: { ...typography.caption, color: colors.textSecondary },
  progressCard: {
    backgroundColor: accents.nutrition.surface,
    borderColor: accents.nutrition.muted,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  progressLine: {
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  remainingText: {
    ...typography.micro,
    color: colors.textMuted,
  },
  overText: { color: colors.warning },
  mealList: {
    gap: spacing.sm,
  },
  mealActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  saveMealBox: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.card,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  mealCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  mealHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  mealTotal: {
    ...typography.bodyStrong,
    color: colors.accent,
  },
  emptyMeal: {
    gap: 12,
  },
  emptyText: {
    ...typography.secondary,
    color: colors.textMuted,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: controlHeights.compact,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  logList: {
    gap: spacing.sm,
  },
  logItem: {
    backgroundColor: colors.surface,
    borderLeftColor: accents.nutrition.muted,
    borderLeftWidth: 2,
    borderRadius: radii.medium,
    gap: spacing.sm,
    padding: spacing.sm,
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
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  logMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  logCalories: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  logAside: { alignItems: 'flex-end', gap: spacing.xxs },
  moreButton: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: controlHeights.compact,
    justifyContent: 'center',
    width: controlHeights.compact,
  },
  logActions: {
    backgroundColor: colors.surfaceInteractive,
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.xxs,
  },
  smallButton: {
    alignItems: 'center',
    borderRadius: radii.medium,
    flex: 1,
    justifyContent: 'center',
    minHeight: controlHeights.compact,
    paddingHorizontal: spacing.sm,
  },
  smallButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteButtonText: { ...typography.caption, color: colors.danger },
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
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  mealPillSelected: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  mealPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  mealPillTextSelected: {
    color: colors.accent,
  },
  editInput: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    ...typography.bodyStrong,
    color: colors.textPrimary,
    minHeight: controlHeights.regular,
    paddingHorizontal: spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    flex: 1,
    justifyContent: 'center',
    minHeight: controlHeights.compact,
  },
  saveButtonText: {
    ...typography.caption,
    color: colors.accentText,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
