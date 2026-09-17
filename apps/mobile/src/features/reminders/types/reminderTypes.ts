export const MAX_REMINDER_MESSAGE_LENGTH = 120;

export type ReminderWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Reminder = {
  id: string;
  message: string;
  hour: number;
  minute: number;
  weekdays: ReminderWeekday[];
  enabled: boolean;
  scheduledIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ReminderDraft = Pick<Reminder, 'message' | 'hour' | 'minute' | 'weekdays' | 'enabled'>;

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';
