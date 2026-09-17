import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  MAX_REMINDER_MESSAGE_LENGTH,
  type Reminder,
  type ReminderDraft,
  type ReminderPermission,
  type ReminderWeekday,
} from '../types/reminderTypes';

const STORAGE_PREFIX = '@gymapp/reminders/v1';
const CHANNEL_ID = 'gymapp-reminders';

type ScheduledRequest = {
  identifier: string;
  content: { data?: Record<string, unknown> | null };
};

export type ReminderStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type NotificationAdapter = {
  getPermission: () => Promise<ReminderPermission>;
  requestPermission: () => Promise<ReminderPermission>;
  schedule: (input: {
    reminderId: string;
    message: string;
    hour: number;
    minute: number;
    weekday?: ReminderWeekday;
  }) => Promise<string>;
  cancel: (id: string) => Promise<void>;
  getScheduled: () => Promise<ScheduledRequest[]>;
};

export class ReminderError extends Error {
  constructor(
    message: string,
    readonly reason: 'validation' | 'permission' | 'storage' | 'schedule',
  ) {
    super(message);
    this.name = 'ReminderError';
  }
}

export type ReminderService = {
  list: (userId: string) => Promise<Reminder[]>;
  create: (userId: string, draft: ReminderDraft) => Promise<Reminder>;
  update: (userId: string, id: string, draft: ReminderDraft) => Promise<Reminder>;
  setEnabled: (userId: string, id: string, enabled: boolean) => Promise<Reminder>;
  remove: (userId: string, id: string) => Promise<void>;
  reconcile: (userId: string) => Promise<Reminder[]>;
  getPermission: () => Promise<ReminderPermission>;
};

export function createReminderService(
  storage: ReminderStorage,
  notifications: NotificationAdapter,
): ReminderService {
  async function list(userId: string): Promise<Reminder[]> {
    try {
      const raw = await storage.getItem(storageKey(userId));
      if (!raw) {
        return [];
      }
      return (JSON.parse(raw) as Reminder[]).map(validateStoredReminder);
    } catch {
      throw new ReminderError('Unable to load reminders from this device.', 'storage');
    }
  }

  async function persist(userId: string, reminders: Reminder[]): Promise<void> {
    try {
      await storage.setItem(storageKey(userId), JSON.stringify(reminders));
    } catch {
      throw new ReminderError('Unable to save reminders on this device.', 'storage');
    }
  }

  async function cancel(reminder: Reminder): Promise<void> {
    await Promise.all(reminder.scheduledIds.map((id) => notifications.cancel(id)));
  }

  async function schedule(reminder: Reminder, requestPermission: boolean): Promise<string[]> {
    if (!reminder.enabled) {
      return [];
    }

    let permission = await notifications.getPermission();
    if (permission !== 'granted' && requestPermission) {
      permission = await notifications.requestPermission();
    }
    if (permission !== 'granted') {
      throw new ReminderError(
        'Notifications are disabled. Allow them in system settings, then try again.',
        'permission',
      );
    }

    const weekdays = reminder.weekdays.length > 0 ? reminder.weekdays : [undefined];
    try {
      return await Promise.all(
        weekdays.map((weekday) =>
          notifications.schedule({
            reminderId: reminder.id,
            message: reminder.message,
            hour: reminder.hour,
            minute: reminder.minute,
            weekday,
          }),
        ),
      );
    } catch {
      throw new ReminderError('Unable to schedule this reminder.', 'schedule');
    }
  }

  async function replace(
    userId: string,
    existing: Reminder | null,
    next: Reminder,
    requestPermission: boolean,
  ): Promise<Reminder> {
    if (existing) {
      await cancel(existing);
    }

    const reminders = await list(userId);
    const unscheduled = { ...next, scheduledIds: [] };
    await persist(
      userId,
      existing
        ? reminders.map((item) => (item.id === existing.id ? unscheduled : item))
        : [...reminders, unscheduled],
    );

    const scheduledIds = await schedule(unscheduled, requestPermission);
    const scheduled = { ...unscheduled, scheduledIds };
    const latest = await list(userId);
    await persist(
      userId,
      latest.map((item) => (item.id === scheduled.id ? scheduled : item)),
    );
    return scheduled;
  }

  return {
    list,
    getPermission: notifications.getPermission,

    async create(userId, draft) {
      const valid = validateDraft(draft);
      const now = new Date().toISOString();
      const reminder: Reminder = {
        ...valid,
        id: createId(),
        scheduledIds: [],
        createdAt: now,
        updatedAt: now,
      };
      return replace(userId, null, reminder, true);
    },

    async update(userId, id, draft) {
      const reminders = await list(userId);
      const existing = reminders.find((item) => item.id === id);
      if (!existing) {
        throw new ReminderError('Reminder not found.', 'storage');
      }
      const next = { ...existing, ...validateDraft(draft), updatedAt: new Date().toISOString() };
      return replace(userId, existing, next, true);
    },

    async setEnabled(userId, id, enabled) {
      const reminders = await list(userId);
      const existing = reminders.find((item) => item.id === id);
      if (!existing) {
        throw new ReminderError('Reminder not found.', 'storage');
      }
      return replace(
        userId,
        existing,
        { ...existing, enabled, updatedAt: new Date().toISOString() },
        enabled,
      );
    },

    async remove(userId, id) {
      const reminders = await list(userId);
      const existing = reminders.find((item) => item.id === id);
      if (!existing) {
        return;
      }
      await cancel(existing);
      await persist(
        userId,
        reminders.filter((item) => item.id !== id),
      );
    },

    async reconcile(userId) {
      const reminders = await list(userId);
      const scheduled = await notifications.getScheduled();
      const ownedIds = scheduled
        .filter((request) => typeof request.content.data?.reminderId === 'string')
        .map((request) => request.identifier);
      await Promise.all(ownedIds.map((id) => notifications.cancel(id)));

      const next: Reminder[] = [];
      for (const reminder of reminders) {
        next.push({
          ...reminder,
          scheduledIds: await schedule({ ...reminder, scheduledIds: [] }, false),
        });
      }
      await persist(userId, next);
      return next;
    },
  };
}

export const nativeNotificationAdapter: NotificationAdapter = {
  async getPermission() {
    return (await Notifications.getPermissionsAsync()).status;
  },
  async requestPermission() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'GymApp reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    return (await Notifications.requestPermissionsAsync()).status;
  },
  schedule({ hour, message, minute, reminderId, weekday }) {
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'GymApp',
        body: message,
        data: { reminderId },
      },
      trigger:
        weekday === undefined
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              channelId: CHANNEL_ID,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday,
              hour,
              minute,
              channelId: CHANNEL_ID,
            },
    });
  },
  cancel: Notifications.cancelScheduledNotificationAsync,
  async getScheduled() {
    return (await Notifications.getAllScheduledNotificationsAsync()) as ScheduledRequest[];
  },
};

export const reminderService = createReminderService(AsyncStorage, nativeNotificationAdapter);

export function configureReminderNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function validateDraft(draft: ReminderDraft): ReminderDraft {
  const message = draft.message.trim();
  if (!message || message.length > MAX_REMINDER_MESSAGE_LENGTH) {
    throw new ReminderError(
      `Reminder message must be 1-${MAX_REMINDER_MESSAGE_LENGTH} characters.`,
      'validation',
    );
  }
  if (!Number.isInteger(draft.hour) || draft.hour < 0 || draft.hour > 23) {
    throw new ReminderError('Reminder hour must be between 0 and 23.', 'validation');
  }
  if (!Number.isInteger(draft.minute) || draft.minute < 0 || draft.minute > 59) {
    throw new ReminderError('Reminder minute must be between 0 and 59.', 'validation');
  }
  const weekdays = [...new Set(draft.weekdays)].sort() as ReminderWeekday[];
  if (weekdays.some((day) => day < 1 || day > 7)) {
    throw new ReminderError('Reminder weekdays are invalid.', 'validation');
  }
  return { ...draft, message, weekdays };
}

function validateStoredReminder(reminder: Reminder): Reminder {
  return {
    ...reminder,
    ...validateDraft(reminder),
    scheduledIds: Array.isArray(reminder.scheduledIds) ? reminder.scheduledIds : [],
  };
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}/${userId}`;
}

function createId(): string {
  return `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
