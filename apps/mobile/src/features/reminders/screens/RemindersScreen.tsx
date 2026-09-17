import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, EmptyState, StatusPill } from '@/design/components';
import { colors, controlHeights, radii, spacing, typography } from '@/design/theme';
import { AuthMessage } from '@/features/auth/components/AuthMessage';
import { useAuth } from '@/features/auth/context/AuthContext';

import { reminderService } from '../services/reminderService';
import type { Reminder, ReminderDraft, ReminderWeekday } from '../types/reminderTypes';

const WEEKDAYS: { label: string; value: ReminderWeekday }[] = [
  { label: 'Sun', value: 1 },
  { label: 'Mon', value: 2 },
  { label: 'Tue', value: 3 },
  { label: 'Wed', value: 4 },
  { label: 'Thu', value: 5 },
  { label: 'Fri', value: 6 },
  { label: 'Sat', value: 7 },
];

const INITIAL_DRAFT: ReminderDraft = {
  message: '',
  hour: 20,
  minute: 30,
  weekdays: [],
  enabled: true,
};

export function RemindersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setReminders(await reminderService.list(userId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load reminders.');
    }
  }, [userId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  async function save() {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (editingId) await reminderService.update(userId, editingId, draft);
      else await reminderService.create(userId, draft);
      setDraft(INITIAL_DRAFT);
      setEditingId(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save reminder.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(reminder: Reminder) {
    if (!userId) return;
    try {
      await reminderService.setEnabled(userId, reminder.id, !reminder.enabled);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update reminder.');
    }
  }

  async function remove(reminder: Reminder) {
    if (!userId) return;
    await reminderService.remove(userId, reminder.id);
    await load();
  }

  function edit(reminder: Reminder) {
    setEditingId(reminder.id);
    setDraft({
      message: reminder.message,
      hour: reminder.hour,
      minute: reminder.minute,
      weekdays: reminder.weekdays,
      enabled: reminder.enabled,
    });
  }

  function toggleWeekday(day: ReminderWeekday) {
    setDraft((current) => ({
      ...current,
      weekdays: current.weekdays.includes(day)
        ? current.weekdays.filter((item) => item !== day)
        : [...current.weekdays, day],
    }));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
        <View>
          <Text style={styles.kicker}>Device Local</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Reminders
          </Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{editingId ? 'Edit Reminder' : 'New Reminder'}</Text>
          <TextInput
            accessibilityLabel="Reminder message"
            maxLength={120}
            onChangeText={(message) => setDraft((current) => ({ ...current, message }))}
            placeholder="Don't forget your protein"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            style={styles.input}
            value={draft.message}
          />
          <View style={styles.timeRow}>
            <TextInput
              accessibilityLabel="Reminder hour"
              keyboardType="number-pad"
              onChangeText={(value) => setDraft((current) => ({ ...current, hour: Number(value) }))}
              style={[styles.input, styles.timeInput]}
              selectionColor={colors.accent}
              value={String(draft.hour)}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              accessibilityLabel="Reminder minute"
              keyboardType="number-pad"
              onChangeText={(value) =>
                setDraft((current) => ({ ...current, minute: Number(value) }))
              }
              style={[styles.input, styles.timeInput]}
              selectionColor={colors.accent}
              value={String(draft.minute)}
            />
          </View>
          <Text style={styles.muted}>No weekdays selected means daily.</Text>
          <View style={styles.weekdays}>
            {WEEKDAYS.map((day) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: draft.weekdays.includes(day.value) }}
                key={day.value}
                onPress={() => toggleWeekday(day.value)}
                style={[styles.day, draft.weekdays.includes(day.value) && styles.daySelected]}
              >
                <Text
                  style={[
                    styles.dayText,
                    draft.weekdays.includes(day.value) && styles.dayTextSelected,
                  ]}
                >
                  {day.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.enabledRow}>
            <View>
              <Text style={styles.enabledTitle}>Enabled</Text>
              <Text style={styles.muted}>Schedule this reminder after saving.</Text>
            </View>
            <Switch
              accessibilityLabel="Reminder enabled"
              onValueChange={(enabled) => setDraft((current) => ({ ...current, enabled }))}
              thumbColor={draft.enabled ? colors.accentText : colors.textMuted}
              trackColor={{ false: colors.surfaceInteractive, true: colors.accent }}
              value={draft.enabled}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={save}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>{busy ? 'Saving' : 'Save Reminder'}</Text>
          </Pressable>
        </View>
        {error ? <AuthMessage message={error} tone="error" /> : null}
        {!error && reminders.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            message="Create a gentle prompt for logging, meal prep, or your weekly check-in."
            title="No reminders yet"
          />
        ) : null}
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.panel}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderIcon}>
                <AppIcon color={colors.accent} name="notifications-outline" />
              </View>
              <Text style={[styles.panelTitle, styles.reminderTitle]}>{reminder.message}</Text>
              <StatusPill
                label={reminder.enabled ? 'On' : 'Off'}
                tone={reminder.enabled ? 'success' : 'neutral'}
              />
            </View>
            <Text style={styles.muted}>
              {formatTime(reminder.hour, reminder.minute)} ·{' '}
              {reminder.weekdays.length
                ? reminder.weekdays
                    .map((day) => WEEKDAYS.find((item) => item.value === day)?.label)
                    .join(', ')
                : 'Daily'}
            </Text>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => edit(reminder)}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Edit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void toggle(reminder)}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>{reminder.enabled ? 'Disable' : 'Enable'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void remove(reminder)}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.lg, padding: spacing.lg },
  kicker: { ...typography.caption, color: colors.accent, textTransform: 'uppercase' },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.xxs },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  panelTitle: { ...typography.sectionTitle, color: colors.textPrimary },
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
  timeRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  timeInput: { flex: 1 },
  colon: { ...typography.sectionTitle, color: colors.textPrimary },
  weekdays: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  day: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  daySelected: { backgroundColor: colors.accentMuted, borderColor: colors.accent },
  dayText: { ...typography.caption, color: colors.textSecondary },
  dayTextSelected: { color: colors.accent },
  enabledRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  enabledTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: controlHeights.regular,
  },
  primaryText: { ...typography.bodyStrong, color: colors.accentText },
  secondary: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceInteractive,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  secondaryText: { ...typography.caption, color: colors.textPrimary },
  muted: { ...typography.secondary, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  reminderHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  reminderIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: radii.medium,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  reminderTitle: { flex: 1 },
});
