# GymApp Architecture

## Overview

GymApp uses a mobile-first client/server architecture.

Mobile Client
↓
Application Services
↓
Supabase / Edge Functions
↓
PostgreSQL + External Nutrition Services

## Technology

### Mobile Application

React Native with Expo and TypeScript.

Use Expo Router for navigation.

### Backend Platform

Supabase provides:

- PostgreSQL
- Authentication
- Storage
- Row Level Security
- Edge Functions

### External Services

USDA FoodData Central:

- general nutrition search
- whole/common food nutrient information

Open Food Facts:

- packaged food lookup
- barcode-based product lookup

FatSecret Premier:

- restaurant and branded food lookup
- autocomplete suggestions
- rich provider serving options

OpenAI:

- food image interpretation
- used only through server-side functions

## Application Layers

The mobile application should approximately follow:

UI
↓
Feature / Application Logic
↓
Service Interfaces
↓
Data/API Layer

React components should not directly contain complex nutrition calculations or provider-specific API parsing.

## Repository Target Structure

gym-app/
apps/
mobile/
app/
src/
components/
features/
auth/
onboarding/
dashboard/
food-search/
diary/
scanner/
camera/
progress/
hooks/
services/
lib/
types/

packages/
nutrition/
api-types/
validation/

supabase/
migrations/
functions/
search-food/
lookup-barcode/
analyze-food-image/

docs/

.github/
workflows/

AGENTS.md
README.md
PRODUCT_REQUIREMENTS.md
ARCHITECTURE.md
TASKS.md

The exact structure may evolve if tooling requirements make small adjustments necessary.

## Data Flow: Food Search

Mobile
→ search request
→ application food service
→ server function
→ USDA
→ provider adapter
→ normalized Food
→ client

TASK-009 implements this through the `search-food` Edge Function. The mobile
food-search service receives only normalized food results and does not parse
USDA response shapes.

## Data Flow: Barcode

Manual UPC/EAN entry
→ backend lookup
→ Open Food Facts
→ normalized Food
→ local display
→ user reviews result
→ Add to Diary flow
→ `food_logs` snapshot

TASK-009 supports manual barcode lookup through `lookup-barcode`. TASK-010
connects lookup results to diary insertion.

TASK-011 adds physical camera barcode scanning:

Expo Camera `CameraView`
→ UPC/EAN barcode string
→ scanner state machine and duplicate-scan lock
→ existing `FoodSearchService.lookupBarcode`
→ existing `lookup-barcode` Edge Function
→ Open Food Facts adapter
→ normalized Food
→ shared Product Detail
→ existing Add to Diary flow
→ `food_logs` snapshot

The scanner does not call Open Food Facts directly and does not parse provider
responses. It supports UPC-A, UPC-E, EAN-13, and EAN-8 where Expo Camera
supports those formats. Barcode values stay strings throughout the flow so
leading zeroes are preserved.

## Data Flow: Provider ID Lookup

Mobile
→ provider id request
→ `lookup-food-id`
→ USDA detail lookup
→ provider adapter
→ normalized Food
→ local display

Frequently retrieved products may eventually be cached in PostgreSQL.

## Data Flow: Food Photo

Expo Camera
→ image
→ Supabase Storage
→ secure backend function
→ OpenAI image analysis
→ structured food candidates
→ nutrition provider lookup
→ normalized food estimates
→ user review
→ diary

OpenAI API credentials must never exist in client-side code.

## Nutrition Domain

Nutrition calculations belong in a standalone package.

Target:

packages/nutrition/

TASK-005 implements `@gymapp/nutrition` as a pure TypeScript workspace package.
It exports:

calculateBMR()

calculateTDEE()

calculateCalorieTarget()

calculateMacroTargets()

calculateNutritionPlan()

unit conversion helpers

Functions should be deterministic where possible and covered by unit tests.

The package uses metric inputs internally: kilograms, centimeters, years, and
kcal/day. BMR uses Mifflin-St Jeor. TDEE uses centralized activity multipliers
whose names match the database `nutrition_goals.activity_level` check
constraint. Goal calories use TDEE plus or minus a configurable weekly
weight-change adjustment based on the documented default assumption of
`7700 kcal/kg`. Protein defaults to `1.8 g/kg`, fat defaults to `0.8 g/kg`, and
carbohydrates receive remaining calories after protein and fat. All public
results are rounded to whole calories or grams.

## Database Domain

Initial tables should eventually include:

profiles

nutrition_goals

foods

food_logs

body_metrics

saved_meals

saved_meal_items

scan_history

food_images

food_image_predictions

Database tables should be introduced through migrations as their related feature is implemented rather than creating unnecessary unused infrastructure immediately.

TASK-004 introduces the first application-owned tables through Supabase migrations:

profiles

nutrition_goals

body_metrics

Supabase Auth remains the source of truth for users in `auth.users`; GymApp does not create a separate application users table.

`profiles.id` is both the primary key and a foreign key to `auth.users(id)`. New Auth users receive a corresponding profile row through a small `auth.users` insert trigger that inserts only the matching profile id.

Migrations backfill profile rows for existing Auth users with `insert ... select ... on conflict do nothing`, so test users created before the profile trigger are also represented in `public.profiles`.

`nutrition_goals` stores historical and current nutrition targets. Old goals remain stored, and a partial unique index allows only one active goal per user.

`body_metrics` stores body-weight history with optional body-fat percentage and a recorded timestamp. It does not store unrelated health or medical data.

All user-owned tables have Row Level Security enabled. Policies use `auth.uid()` to ensure authenticated users can only select, insert, update, or delete rows they own. Profile inserts are handled by the Auth trigger rather than by direct client inserts.

Rows with `updated_at` use a shared trigger function that refreshes the timestamp on update.

The mobile app reads profile state through a dedicated profile service rather than querying Supabase directly in route components. The authenticated route group waits for session restoration and profile loading, then sends incomplete profiles to an onboarding placeholder route and completed profiles to the authenticated home placeholder.

Profile fetch failures and missing profile rows are treated as recoverable application errors instead of silently entering the main app. Development builds log sanitized routing diagnostics: user id, profile presence, onboarding status, route decision, redirect target, and safe Supabase error metadata. The app refetches the profile when returning to the foreground, which gives developers a simple way to verify manual `onboarding_completed` database changes without adding real TASK-006 onboarding UI.

TASK-006 replaces the onboarding placeholder with a multi-step nutrition onboarding flow in `apps/mobile/src/features/onboarding`. The UI collects preferred units, date of birth, sex used for calculation, height, current weight, activity level, goal, optional target weight, and optional weekly rate. The user can move backward without losing entered values and reviews calculated targets before anything is saved.

Onboarding supports both imperial and metric input. Unit conversion happens at the onboarding boundary using `@gymapp/nutrition` helpers; persisted values are normalized to metric database columns (`height_cm`, `current_weight_kg`, `target_weight_kg`, `weekly_rate_kg`). Switching units converts currently entered values instead of clearing them.

Onboarding calculations call `calculateNutritionPlan()` from `@gymapp/nutrition` with normalized metric values. The mobile app does not duplicate BMR, TDEE, calorie, or macro formulas.

Onboarding completion is saved through the `public.complete_nutrition_onboarding` RPC. The function runs the logically related writes in one database transaction: update the profile, mark existing active nutrition goals inactive, insert the new active nutrition goal, insert an initial body metric for the current weight when an equivalent same-day entry does not already exist, and set `profiles.onboarding_completed = true`. The RPC uses `auth.uid()` for ownership and does not accept a client-supplied user id.

TASK-007 replaces the authenticated home placeholder with a target-focused
nutrition dashboard in `apps/mobile/src/features/dashboard`. The dashboard data
flow is:

Authenticated route
→ dashboard hook
→ dashboard service
→ Supabase RLS reads from `profiles` and the active `nutrition_goals` row
→ target-only presentation components

The active goal query fetches the current row from `public.nutrition_goals`
where `user_id` is the authenticated user and `is_active = true`, selecting
goal type, target weight, activity level, weekly rate, daily calories, protein,
carbohydrates, fat, and creation time. Presentation components receive mapped
application types rather than raw Supabase rows.

TASK-007 originally displayed targets before diary logging existed. TASK-010
updates the dashboard to display consumed / target progress from today's
persisted `food_logs`.

Weight values remain normalized in metric database columns. Dashboard display
uses `profiles.preferred_unit_system` and the `@gymapp/nutrition` conversion
helpers so imperial users see pounds and metric users see kilograms. A small
settings route preserves account visibility and sign-out without introducing a
full settings system.

TASK-008 adds editable nutrition goals through `apps/mobile/src/features/goals`.
The edit screen loads the authenticated user's profile and active goal through
a goals service, validates target edits outside the UI, shows macro calorie
math, and can reset the form to recommended targets by calling
`calculateNutritionPlan()` from `@gymapp/nutrition`.

Goal edits are saved through `public.replace_active_nutrition_goal`. This RPC
uses `auth.uid()`, locks the current active goal, marks it inactive, and inserts
a replacement active goal in the same transaction. Existing goal context such
as goal type, target weight, activity level, and weekly rate is preserved. The
new `nutrition_goals.target_source` column records whether the active targets
come from recommended calculations or user customization.

TASK-008 also introduces the food diary foundation in
`apps/mobile/src/features/diary` and the `public.foods` / `public.food_logs`
tables. `foods` stores normalized nutrition data with distinct identities for
provider records, barcodes, internal records, and user-created foods. Provider
records are readable by authenticated users but cannot be modified by mobile
clients; user-created foods are owned through `created_by`.

`food_logs` stores user-owned diary entries with a nullable source `food_id`,
meal type, quantity, `logged_at`, and nutrition snapshots copied at log time.
Snapshots include name, brand, serving details, calories, protein,
carbohydrates, fat, and optional micronutrient fields. Diary utilities compute
one-serving, multi-serving, and fractional-serving snapshots, aggregate daily
totals, calculate remaining target values, and derive local-day UTC ranges from
the device timezone.

TASK-008 does not add provider API calls, barcode scanning, search UI, full
diary screens, consumed dashboard totals, or AI recognition.

TASK-009 adds `apps/mobile/src/features/food-search` and three Supabase Edge
Functions: `search-food`, `lookup-food-id`, and `lookup-barcode`. The mobile
service calls these functions through Supabase Functions, while provider
adapters in `supabase/functions/_shared` convert USDA FoodData Central and Open
Food Facts responses into the app's normalized food lookup result. USDA access
requires the server-side `USDA_FDC_API_KEY` secret; the key is never exposed
through Expo public environment variables.

The Find Food UI supports text search, manual barcode entry, and USDA FDC ID
lookup. It displays provider source labels, serving basis, calories, macros,
and optional nutrient details.

TASK-013 adds FatSecret Premier as a third food provider. Supabase Edge
Functions use OAuth 2.0 client credentials server-side, cache the bearer token
until shortly before expiry, and never return tokens or FatSecret credentials
to the mobile app. `search-food` now performs resilient multi-provider search
across FatSecret and USDA, merges normalized results, and ranks restaurant /
branded intent toward FatSecret while preserving USDA priority for generic
foods. `autocomplete-food` uses FatSecret autocomplete for debounced
suggestions. `lookup-food-id` accepts both USDA FDC IDs and FatSecret Food IDs.
FatSecret `food.get.v5` serving options are preserved in the normalized model
so Add to Diary can offer provider servings without FatSecret-specific UI math.

TASK-013.5 refines the shared search boundary without making autocomplete a
prerequisite. The mobile search input submits its current text on both the
button and keyboard Return action. Mobile and Edge Function validation apply
the same small, deterministic alias layer for spacing and punctuation variants
such as `in n out` / `in-n-out`, plus high-confidence typo corrections such as
`chipolte` / `chipotle`. The visible input is not replaced.

The Edge Function ranking strategy first scores normalized name and token
matches, then applies query-aware provider roles. For restaurant intent, exact
brand-token matches and relevant FatSecret results receive a bounded boost;
USDA is not globally demoted. For generic queries such as `chicken breast`,
the existing USDA preference remains. `search-food` uses `Promise.allSettled`
so a FatSecret failure still returns USDA results. The mobile session cache is
keyed by normalized query and expires after five minutes. Result cards preserve
the normalized provider source label for FatSecret, USDA, and Open Food Facts.

TASK-011 adds `apps/mobile/src/features/scanner` and the authenticated
`/scan` route. The scanner screen handles permission states explicitly:
not-yet-requested, granted, and denied. Denied users see an Open Settings
action and the existing manual barcode fallback. Granted users see the
`CameraView` scanner, a visual barcode frame, flash/torch toggle, scan-again
recovery, and manual entry fallback.

The scanner hook uses an explicit status machine: `ready`, `detected`,
`looking_up`, `success`, `not_found`, and `error`. Once the first valid barcode
event is accepted, scanning is locked so repeated camera callbacks for the same
visible barcode cannot issue duplicate provider lookups or navigate multiple
times. Scanning unlocks only when the user taps Scan Again or returns to the
scanner.

TASK-010.6 keeps the provider boundary intact while improving search behavior
inside the mobile feature. `FoodSearchService.fetchRecentFoods()` maps recent
`food_logs` snapshots into the same normalized `FoodSearchResult` shape as
provider results. The `useFindFood` hook debounces text input, caches provider
responses by normalized query for the current session, applies lightweight
typo correction and fuzzy ranking, and mixes recent foods into ranked results.
No provider-specific response formats leak into React components.

Normalized food lookup results carry an explicit nutrition basis:
`per_serving`, `per_100g`, `per_100ml`, or `unknown`. Open Food Facts adapter
logic treats provider values conservatively. Explicit `_serving` nutriments are
used only when enough required serving nutrition and a serving size are present.
Otherwise, `_100g` nutriments are converted to one serving when the product has
a gram serving size. If a serving size is missing, the result remains
`per_100g` and the mobile UI labels quantity as 100g portions instead of
servings.

`servingDescription` preserves provider labels such as `1 bar (45 g)` for
display, while parsed `servingSize` and `servingUnit` drive calculations when
available. `servingsPerContainer` is package metadata only. It is displayed to
help the user understand the container, but it never changes the nutrition for
one serving.

TASK-010 replaces that placeholder with real diary persistence. Product Detail
passes the selected normalized provider food into
`apps/mobile/src/features/diary/components/AddFoodPanel`, which lets the user
choose meal type and serving quantity. The add flow uses diary domain utilities
to calculate preview totals, then inserts a real `public.food_logs` row through
the public Supabase client under RLS.

Food log nutrition columns store total consumed nutrition for the selected
quantity. The TASK-010 migration also stores per-serving snapshot columns:
`serving_calories`, `serving_protein_g`, `serving_carbs_g`, `serving_fat_g`,
and optional fiber, sugar, and sodium serving values. Editing quantity uses
those per-serving values, not the previous total, so repeated edits do not
compound rounding or multiply an already-multiplied log.

Provider food lookup results currently use `food_id = null` when logged because
mobile clients are intentionally not allowed to create shared provider-owned
`foods` rows. The log snapshot remains complete. A future provider-cache write
path should be server-side or otherwise explicitly designed so it does not
weaken provider food RLS.

Existing diary rows are historical snapshots. If a provider normalization bug is
fixed later, already-created test logs are not silently rewritten by the mobile
app; developers should delete incorrect test diary rows or handle migration
explicitly if a production correction is ever required.

TASK-010.5 separates canonical serving nutrition from user portion input. The
canonical serving remains the provider-normalized basis: for example, Quest
Protein Chips are still `1 serving = 32 g` with `140 kcal`, `20 g protein`,
`4 g carbs`, and `4.5 g fat`. Add to Diary lets the user enter a physical
amount such as servings, grams, ounces, milliliters, cups, tablespoons, or a
provider-defined household unit when that unit is mathematically safe for the
food.

Portion math lives in `apps/mobile/src/features/diary/utils/portionUtils.ts`.
It centralizes exact mass and volume conversion constants, available-unit
selection, serving-equivalent calculation, typed unsupported-conversion errors,
and final nutrition totals. UI components do not perform conversion arithmetic.

Mass and volume are intentionally isolated. Mass foods expose only serving,
provider-defined mass household portions, `g`, `kg`, `oz`, and `lb`. Volume
foods expose only serving, provider-defined volume household portions, `mL`,
`L`, US `fl oz`, `cup`, `tbsp`, and `tsp`. The app does not convert between
mass and volume without a product-specific relationship.

`food_logs.quantity` remains the serving equivalent for backward-compatible
daily totals and editing, while `portion_amount`, `portion_unit`, and
`serving_equivalent` preserve what the user actually entered. Editing a log
recalculates from the stored per-serving snapshot fields and the new portion
input, never from previously multiplied total nutrition.

TASK-010.6 adds `food_logs.item_quantity` as the physical item count for a
single diary row. Item quantity is separate from portion amount: `3 x 1 banana`
and `1 x 3 bananas` can resolve to the same total normalized amount, but the UI
can preserve the way the user thought about the log. Portion utilities multiply
the normalized per-item portion by `item_quantity`, derive
`serving_equivalent` from that total, and calculate nutrition from the original
canonical serving snapshot. Existing rows are backfilled to `item_quantity = 1`.

Today's Diary lives in `apps/mobile/src/features/diary/screens/DiaryScreen`.
It fetches `food_logs` for local calendar-day boundaries using device-local
midnight converted to UTC timestamps, groups rows into Breakfast, Lunch,
Dinner, and Snacks, computes meal and daily totals, supports meal, item
quantity, and portion edits, and confirms deletes. Dashboard and diary screens
refetch on focus so add/edit/delete changes appear without an app restart.

Dashboard progress combines the active `nutrition_goals` row with today's
`food_logs`. Percentages now mean consumed grams divided by target grams, not
macro calorie allocation. Visual bars clamp at 100%; over-target text preserves
the positive overage while remaining values are never shown as negative.

## Security

All private user data must be protected using Supabase Row Level Security.

Client requests use the authenticated user's Supabase session.

Service-role credentials must never be shipped in the mobile application.

Third-party secrets are stored server-side.

Supabase Edge Functions read required provider secrets through
`supabase/functions/_shared/server-env.ts`, which validates required variables
and reports missing configuration by variable name without exposing secret
values.

## Mobile Supabase Client Foundation

The Expo app centralizes public runtime configuration in `apps/mobile/src/lib/env.ts`.

The shared Supabase client is created once in `apps/mobile/src/lib/supabase.ts` using `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

React Native session persistence is prepared with AsyncStorage, `react-native-url-polyfill`, Supabase `processLock`, automatic token refresh, persisted sessions, and URL session detection disabled. Authentication screens and protected routes are intentionally deferred to TASK-003.

## Authentication

TASK-003 implements Supabase email/password authentication in `apps/mobile/src/features/auth`.

Supabase calls are wrapped by an auth service instead of being made directly from React components. The auth provider restores the persisted session on startup, observes Supabase auth state changes, exposes session/user state through React Context, and cleans up the auth listener on unmount.

Expo Router route groups separate unauthenticated screens from authenticated application screens:

- `app/(auth)` contains sign-in and sign-up routes and redirects authenticated users into the app.
- `app/(app)` contains protected routes and redirects signed-out users to sign-in.

The authenticated home screen is temporary until dashboard and onboarding tasks are implemented. TASK-003 does not introduce application database tables or migrations.

## API Abstraction

Provider-specific objects must not leak throughout the UI.

Example internal interface:

Food {
id
externalId
source
name
brand
barcode
servingSize
servingUnit
calories
proteinG
carbsG
fatG
}

Provider adapters convert:

USDA → Food

Open Food Facts → Food

FatSecret → Food

This allows providers to change without rewriting the application.

The normalized model keeps provider ids separate from barcodes. A USDA item can
be identified by `{ source: 'usda', externalId }`, an Open Food Facts product
can use both a provider id and a barcode, and a FatSecret item can be
identified by `{ source: 'fatsecret', externalId }`. A scanned barcode can be
passed around independently before a provider match exists.

For TASK-009, provider records are not written into `public.foods` by the mobile
client. That avoids granting the client write access to shared provider-owned
foods before a deliberate caching or diary persistence design exists.

TASK-010 preserves this boundary by allowing `food_logs.food_id` to remain null
for provider lookup results while still storing complete snapshots.

TASK-012 adds `apps/mobile/src/features/saved-meals` and the
`favorite_foods`, `saved_meals`, and `saved_meal_items` tables. Favorites point
at `public.foods` rows without modifying shared provider-owned foods. When a
user favorites a provider result that does not already have a `food_id`, the
mobile app stores a user-owned normalized food copy with `source = 'user'` and
then favorites that private row. This preserves the provider RLS boundary while
making favorites reusable without another provider API request.

Saved meal items copy the same immutable nutrition and portion snapshots used
by `food_logs`: food name, brand, item quantity, portion amount/unit, serving
equivalent, serving details, per-serving nutrition, and total nutrition. Logging
a saved meal uses the `public.log_saved_meal` RPC so all item rows become new
`food_logs` rows in one database operation. The selected meal type applies to
each logged item, and the 0.5x/1x/2x multiplier scales item quantity, serving
equivalent, and total nutrition while leaving the saved meal definition and
historical logs unchanged.

## Error Handling

External API operations should distinguish between:

- no result
- invalid input
- provider unavailable
- rate limit
- authentication failure
- server failure

UI should display appropriate retry or correction actions.

## Presentation Formatting

Nutrition domain values keep their calculation/storage precision. UI
components format values at the presentation boundary so dashboard and diary
screens do not expose long floating-point values.

Dashboard display conventions:

- consumed calories round to whole kcal
- macro grams show at most one useful decimal
- target text wraps as `consumed` plus `of target unit`
- remaining text uses human wording such as `493 kcal remaining`
- over-target text uses `over target` rather than negative remaining values
- progress bars clamp their visual fill from 0% to 100% while retaining actual
  overage values in text

Loading states should prefer localized placeholders over flashing stale or
incorrect nutrition totals. User-facing errors should be specific enough to
name the failing workflow without exposing raw provider or database details.

## Scalability Strategy

The initial application does not need microservices.

Use a modular monolith architecture.

Scale individual external-service integrations or backend workloads only when actual usage requires it.

Prioritize:

- clean module boundaries
- database indexes
- caching
- API abstraction
- server-side secrets
- observability
- reliable migrations

over premature distributed architecture.

## Testing Strategy

Unit tests:

- nutrition calculations
- formatters
- adapters
- validation

Integration tests:

- database operations where practical
- Edge Functions
- API normalization

UI tests:

- critical user interactions

End-to-end testing may be added after major MVP flows stabilize.

## Deployment Strategy

Mobile:
Expo / EAS

Backend:
Supabase

Repository:
GitHub

CI:
GitHub Actions

CI should eventually run:

- formatting checks
- lint
- TypeScript compilation/type checking
- automated tests
