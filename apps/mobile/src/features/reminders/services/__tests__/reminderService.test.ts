import {
  createReminderService,
  ReminderError,
  type NotificationAdapter,
  type ReminderStorage,
} from '../reminderService';

describe('reminder service', () => {
  it('creates a daily reminder after contextual permission and persists its schedule', async () => {
    const harness = createHarness('undetermined');
    harness.notifications.requestPermission.mockResolvedValue('granted');
    const reminder = await harness.service.create('user', draft());
    expect(harness.notifications.requestPermission).toHaveBeenCalledTimes(1);
    expect(harness.notifications.schedule).toHaveBeenCalledWith(
      expect.objectContaining({ weekday: undefined }),
    );
    expect(reminder.scheduledIds).toEqual(['schedule-1']);
    expect(await harness.service.list('user')).toEqual([reminder]);
  });

  it('creates one weekly schedule per selected weekday', async () => {
    const harness = createHarness('granted');
    harness.notifications.schedule.mockResolvedValueOnce('mon').mockResolvedValueOnce('fri');
    const reminder = await harness.service.create('user', draft({ weekdays: [2, 6] }));
    expect(reminder.scheduledIds).toEqual(['mon', 'fri']);
    expect(harness.notifications.schedule).toHaveBeenCalledTimes(2);
  });

  it('cancels old schedules before edit, disable, re-enable, and delete', async () => {
    const harness = createHarness('granted');
    const created = await harness.service.create('user', draft());
    await harness.service.update('user', created.id, draft({ message: 'Updated' }));
    expect(harness.notifications.cancel).toHaveBeenCalledWith('schedule-1');
    const disabled = await harness.service.setEnabled('user', created.id, false);
    expect(disabled.scheduledIds).toEqual([]);
    const enabled = await harness.service.setEnabled('user', created.id, true);
    expect(enabled.scheduledIds).toHaveLength(1);
    await harness.service.remove('user', created.id);
    expect(await harness.service.list('user')).toEqual([]);
  });

  it('keeps an unscheduled reminder when permission is denied', async () => {
    const harness = createHarness('denied');
    await expect(harness.service.create('user', draft())).rejects.toMatchObject({
      reason: 'permission',
    });
    expect(await harness.service.list('user')).toHaveLength(1);
  });

  it.each([
    [draft({ message: '   ' }), 'message'],
    [draft({ message: 'a'.repeat(121) }), 'message'],
    [draft({ hour: 24 }), 'hour'],
    [draft({ minute: 60 }), 'minute'],
  ])('rejects malformed reminder data', async (invalid) => {
    const harness = createHarness('granted');
    await expect(harness.service.create('user', invalid)).rejects.toBeInstanceOf(ReminderError);
  });

  it('reconciles owned schedules without touching unrelated notifications', async () => {
    const harness = createHarness('granted');
    await harness.service.create('user', draft());
    harness.notifications.getScheduled.mockResolvedValue([
      { identifier: 'owned', content: { data: { reminderId: 'reminder' } } },
      { identifier: 'other', content: { data: {} } },
    ]);
    await harness.service.reconcile('user');
    expect(harness.notifications.cancel).toHaveBeenCalledWith('owned');
    expect(harness.notifications.cancel).not.toHaveBeenCalledWith('other');
  });
});

function draft(overrides = {}) {
  return {
    message: 'Time to log',
    hour: 20,
    minute: 30,
    weekdays: [],
    enabled: true,
    ...overrides,
  };
}

function createHarness(permission: 'granted' | 'denied' | 'undetermined') {
  const values = new Map<string, string>();
  const storage: jest.Mocked<ReminderStorage> = {
    getItem: jest.fn(async (key) => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
  let sequence = 0;
  const notifications: jest.Mocked<NotificationAdapter> = {
    getPermission: jest.fn().mockResolvedValue(permission),
    requestPermission: jest.fn().mockResolvedValue(permission),
    schedule: jest.fn(
      async (_input: Parameters<NotificationAdapter['schedule']>[0]) => `schedule-${++sequence}`,
    ),
    cancel: jest.fn().mockResolvedValue(undefined),
    getScheduled: jest.fn().mockResolvedValue([]),
  };
  return { storage, notifications, service: createReminderService(storage, notifications) };
}
