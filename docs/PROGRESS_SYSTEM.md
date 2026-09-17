# Progress System

## Scope

TASK-015.5 establishes deterministic progress data, local reminders, and minimal verification UI. TASK-016 owns visual design, graphs, and calendar presentation.

## Weight Check-Ins

- `public.body_metrics` remains the source of truth.
- Weight is stored canonically in kilograms with two-decimal database precision.
- `profiles.preferred_unit_system` controls kg/lb display; changing it does not rewrite history.
- `local_date` records the calendar date selected by the device. A unique `(user_id, local_date)` index permits one official check-in per local day.
- Saving again on the same day updates that check-in. `public.upsert_weight_check_in` also updates `profiles.current_weight_kg` atomically.
- Existing body-metric RLS limits select, insert, update, and delete to the authenticated owner.
- Week calculations use Monday through Sunday local calendar dates, not elapsed 24-hour windows.
- Graph-ready points support 1 month, 3 months, 6 months, 1 year, and all-time ranges.

Legacy records are backfilled using the UTC date already present in `recorded_at`, because their original device-local date was not stored.

## Tracking And Consistency

A tracked day is a local calendar day containing at least one valid persisted `food_logs` row. Multiple foods count as one tracked day.

- Current streak ends today when today is tracked, or yesterday when today is not yet tracked. It is zero after a full missed day.
- Longest streak is the longest consecutive sequence of local dates.
- Current-month consistency is tracked days divided by elapsed days through today.
- Historical-month consistency uses every day in that month.
- Future dates are excluded.
- Total tracked days is a lifetime unique-date count and never resets.
- Month/year calendar models expose semantic `future`, `untracked`, and `tracked` states plus entry count and optional calorie total. They contain no colors.

Diary history is fetched in 1,000-row pages and aggregated in one pass, avoiding per-day and per-month queries.

## Monthly Recaps

Recaps expose tracked/eligible days, consistency, longest streak, total foods, tracked-day macro averages, and monthly starting/ending weight. Weight change requires at least two check-ins.

Historical nutrition-goal snapshots do not exist. Calorie-target and protein-target adherence therefore return `null`; current targets are never applied retroactively. A future migration may snapshot goal targets by effective date.

## Local Reminders

Reminder configurations are stored per authenticated user in device AsyncStorage. This is intentional for v1 because native schedules are device-specific and cross-device synchronization would not synchronize actual delivery.

- Messages are trimmed and limited to 120 characters.
- Daily schedules use local hour/minute recurrence.
- Weekday schedules create one weekly native schedule per selected weekday.
- Permission is requested only when creating or enabling a reminder.
- Denial preserves the reminder configuration without crashing.
- Edit, disable, re-enable, delete, and reconciliation cancel old identifiers before scheduling replacements.
- Reconciliation only cancels GymApp-owned notifications identified by reminder metadata.

Calendar recurrence is designed to remain at the selected local wall-clock time across timezone/DST changes. Final delivery is controlled by iOS/Android and may be delayed by system notification policies.

## Custom Foods

Custom foods are private `public.foods` rows with `source = 'user'`, `created_by` set to the owner, and a namespaced `manual:<user>:<unique>` external identity. The existing food RLS protects them. Logging uses the existing `AddFoodPanel` and immutable `food_logs` snapshot calculations, including fractional servings.

## V1 Feature Freeze

GymApp v1 includes authentication/profile/onboarding/goals; USDA, FatSecret, and Open Food Facts search/barcodes; custom foods; serving controls; diary; favorites/saved meals/re-log; weight check-ins/history; calendar-ready tracking data; streaks; consistency; monthly recap facts; and custom local reminders.

Post-v1 backlog: Apple Health/HealthKit, widgets, workout and water tracking, AI coaching, AI photo nutrition, social/community, shareable recap images, remote push campaigns, friend challenges, and advanced achievements/gamification.
