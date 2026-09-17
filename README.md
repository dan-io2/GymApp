# GymApp

GymApp is a mobile nutrition and macro tracking application designed for gym users who want a fast way to manage calorie and macronutrient goals.

It combines personalized nutrition targets with food lookup, barcode scanning,
flexible portion logging, and a daily diary in a modular Expo and Supabase
application.

## Screenshots / Demo

Screenshots and a public demo build will be added after the first repository
release. No screenshots are included here yet.

## Core Features

- Personalized calorie and macronutrient targets
- Custom protein, carbohydrate, and fat goals
- Daily nutrition dashboard with consumed and remaining totals
- Breakfast, lunch, dinner, and snacks food diary
- Camera barcode scanning and manual barcode lookup
- Flexible serving sizes, units, and physical item quantities
- Typo-tolerant free-text food search with optional autocomplete
- Restaurant and branded food search
- Favorite foods and saved meals
- One-tap re-log from immutable diary snapshots

## Nutrition Providers

- USDA FoodData Central provides general food and nutrition results.
- Open Food Facts provides packaged-food barcode lookup.
- FatSecret Premier provides restaurant, branded-food, autocomplete, and
  serving-option data.

Provider credentials remain server-side in Supabase Edge Functions.

## Architecture

```text
Expo / React Native mobile app
              |
              v
           Supabase
        /      |       \\
      Auth  PostgreSQL  Edge Functions
                            |
             +--------------+--------------+
             |              |              |
           USDA     Open Food Facts    FatSecret
```

## Technical Highlights

- Strict TypeScript with feature-based mobile modules
- Supabase PostgreSQL with Row Level Security
- Server-side OAuth 2.0 client-credentials integration
- Normalized multi-provider food models
- Deterministic provider ranking and identity-based deduplication
- Expo Camera barcode scanning
- Centralized serving, unit, and portion conversion
- Jest and React Native Testing Library coverage

## Project Status

TASK-010 adds real food logging and daily progress. Authenticated users who
have completed onboarding can search USDA FoodData Central, manually enter a
UPC/EAN barcode for Open Food Facts lookup, review a product, choose meal and
serving details, save a real `food_logs` row, view Today's Diary, edit or
delete diary items, and see dashboard consumed/remaining nutrition update from
persisted data. The Add to Diary flow supports separate item quantity and
portion size, so a user can log examples such as `3 x 1 banana`, `2 x 1 breast`,
or `8 x 1 serving`.

TASK-011 adds physical camera barcode scanning with Expo Camera.

TASK-012 adds favorite foods, saved meals, and one-tap re-log. Users can
favorite normalized foods, see favorites in Find Food, save a populated diary
meal as a reusable saved meal, log saved meals through a database RPC, and log
a previous diary row again from its immutable snapshot. Recipes and AI food
recognition are intentionally not implemented yet.

TASK-015.5 adds the v1 progress foundation: canonical weight check-ins,
unit-aware history, local-calendar streaks and consistency, calendar/graph-ready
data, deterministic monthly recap facts, device-local custom reminders, and
manual custom-food creation through the existing diary snapshot flow. See
`docs/PROGRESS_SYSTEM.md` for exact semantics and limitations.

## Tech Stack

- React Native with Expo
- Expo Router
- TypeScript in strict mode
- ESLint
- Prettier
- Jest with React Native Testing Library
- pnpm workspaces

## Requirements

Use Node.js 22.13 or newer. Expo SDK 57 targets Node 22.13.x or newer.

This repository uses pnpm:

```sh
pnpm install
```

## Supabase Setup

TASK-002 adds the mobile Supabase client foundation. To run any code that imports the Supabase client, create a Supabase project and provide the public client configuration.

Copy the example environment file into the Expo app:

```sh
cp .env.example apps/mobile/.env
```

Then fill in:

```sh
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Use the project URL and public anon/publishable key from your Supabase project settings. These values are intended for the mobile client when Row Level Security is configured correctly. Do not put service-role keys, OpenAI keys, USDA keys, or other server-only secrets in any `EXPO_PUBLIC_*` variable.

Local `.env` files are ignored by Git and must not be committed.

## Database Migrations

TASK-004 adds Supabase migrations for the initial authenticated user schema.

Install the Supabase CLI, then link this repository to your Supabase project:

```sh
supabase login
supabase link --project-ref <your-project-ref>
```

Apply migrations to the linked remote project:

```sh
supabase db push
```

Generate TypeScript database types after the migration is applied:

```sh
supabase gen types typescript --linked > apps/mobile/src/types/database.ts
```

TASK-004 migrations also backfill missing profile rows for existing Auth users. New Auth users receive a profile automatically through a database trigger.

TASK-006 adds a `complete_nutrition_onboarding` RPC. The mobile app calls this
function when the user confirms onboarding so profile updates, nutrition goal
creation, previous active-goal deactivation, initial body metric creation, and
`onboarding_completed = true` are handled atomically by the database.

TASK-007 reads the dashboard data through the mobile dashboard service. The
service fetches the authenticated user's profile and current active row from
`public.nutrition_goals` where `user_id` matches the session user and
`is_active = true`. These reads use the public Supabase client with RLS; no
service-role credentials are used in the mobile app.

TASK-008 adds a `replace_active_nutrition_goal` RPC for editing targets. The
RPC deactivates the previous active goal and inserts the replacement active
goal in one database transaction while preserving the existing goal context.
Targets are marked with `target_source = recommended` or `custom`.

TASK-008 also introduces `public.foods` and `public.food_logs`. Food records
use a normalized model with distinct provider identifiers and barcode values.
Food log rows store nutrition snapshots, quantity, meal type, and `logged_at`
so historical diary entries are stable even if a source food changes later.
RLS restricts diary rows to their owner and prevents mobile clients from
modifying provider-owned foods.

TASK-010 adds per-serving snapshot columns to `public.food_logs` so editing a
diary item can recalculate totals from the original serving nutrition rather
than multiplying an already-multiplied total. Apply migrations after pulling
this task:

```sh
supabase db push
supabase gen types typescript --linked > apps/mobile/src/types/database.ts
```

TASK-010.6 adds `food_logs.item_quantity` for physical item counts. The column
is separate from `portion_amount`, `portion_unit`, and `serving_equivalent`.
Apply the included migration before manually testing quantity-based logging
against a remote Supabase project.

TASK-012 adds `favorite_foods`, `saved_meals`, `saved_meal_items`, and the
`log_saved_meal` RPC. Favorite foods point at user-owned or existing food rows.
Saved meal items snapshot the same nutrition and portion fields used by diary
logs so saved meals can be logged later without calling USDA or Open Food Facts.
Apply the included migration before manually testing favorites or saved meals
against a remote Supabase project.

## Nutrition Provider Functions

TASK-009 adds Supabase Edge Functions for provider lookups:

```sh
search-food
lookup-food-id
lookup-barcode
```

`search-food` and `lookup-food-id` call USDA FoodData Central and require the
server-side secret `USDA_FDC_API_KEY`. FatSecret Premier search, autocomplete,
and food detail lookup require `FATSECRET_CLIENT_ID` and
`FATSECRET_CLIENT_SECRET` as Supabase server-side secrets. Do not put these keys
in `apps/mobile/.env`, any `EXPO_PUBLIC_*` variable, source code, tests, or
documentation.

Set these secrets on the linked Supabase project:

```text
USDA_FDC_API_KEY
FATSECRET_CLIENT_ID
FATSECRET_CLIENT_SECRET
```

Deploy the functions:

```sh
supabase functions deploy search-food
supabase functions deploy lookup-food-id
supabase functions deploy lookup-barcode
supabase functions deploy autocomplete-food
```

For local Edge Function development, create an ignored
`supabase/functions/.env` from `supabase/functions/.env.example` and fill in
the USDA key there.

FatSecret attribution is displayed in Find Food autocomplete, results/detail,
and Add to Diary surfaces when FatSecret data is used.

Food search accepts either an autocomplete selection or the user's current
free-text query submitted with the Search button or keyboard Return action.
The search boundary trims and collapses whitespace, normalizes clear
restaurant formatting variants such as `in n out` / `in-n-out` and `chick fil
a` / `chick-fil-a`, and applies only a small set of high-confidence typo
corrections. Autocomplete remains optional assistance and never controls
whether a typed query can run.

Restaurant intent is ranked deterministically: matching brand tokens and food
name tokens give relevant FatSecret restaurant results priority for branded
queries, while generic queries retain USDA priority. Search is resilient to a
single provider failure and returns the providers that succeeded. Session
search cache entries expire after five minutes so a temporary USDA-only result
does not mask later FatSecret availability indefinitely. Provider source labels
remain visible on result cards during development.

Local Supabase development can be started with:

```sh
supabase start
```

This requires Docker. Do not create or edit application tables manually in the dashboard when a migration should represent the change.

## Run the Mobile App

Start the Expo development server from the repository root:

```sh
pnpm dev
```

Then open the app with Expo Go, an iOS simulator, an Android emulator, or the Expo web target from the terminal UI. Authentication screens require `apps/mobile/.env` to contain the Supabase project URL and public anon/publishable key.

Authenticated users are routed by profile state:

- missing or unloadable profile → safe profile status screen
- incomplete profile onboarding → nutrition onboarding flow
- completed onboarding → nutrition dashboard

The onboarding flow supports imperial and metric input. Values are normalized
before saving: weight is stored as kilograms and height is stored as
centimeters. Calculated calories and macros come from `@gymapp/nutrition`.

The dashboard displays target values only:

- today's calorie target
- protein target
- carbohydrate target
- fat target
- current goal, activity level, current weight, target weight, and weekly rate
  when available

The dashboard edit action opens a target editor for calories, protein,
carbohydrates, and fat. Saving creates a new active goal; it does not overwrite
historical goal rows.

The dashboard Find Food action opens `/find-food`. Food lookup can display
normalized USDA and Open Food Facts details, including source labels, provider
IDs, barcodes, serving basis, calories, protein, carbohydrates, fat, fiber,
sugar, and sodium when available.

The dashboard Scan Barcode action opens `/scan`. The scanner uses the physical
iPhone camera through `expo-camera`, detects UPC-A, UPC-E, EAN-13, and EAN-8
barcodes where supported, and sends the detected barcode string through the
same `lookup-barcode` service used by manual barcode entry. Barcodes remain
strings so leading zeroes are preserved.

Provider nutrition is normalized to a clear serving basis before it reaches the
mobile UI. Open Food Facts barcode lookups prefer explicit per-serving nutrient
fields when the provider supplies them. If only per-100g nutrients are present
and a gram serving size is known, the Edge Function converts those values to one
serving. `servingsPerContainer` is displayed as package context only; it is not
used as the amount consumed for one serving.

The Product Detail Add to Diary action opens a real add-food flow. Item
quantity means how many physical items are being logged. Portion amount and
unit describe each item. The serving equivalent is calculated from the total
normalized amount for nutrition math. For example, `3 x 1 banana (118 g)` logs
`354 g` total nutrition, while `8 x 1 serving` of a packaged item logs eight
servings in one diary row.

TASK-010.5 extends Add to Diary with flexible portion entry. The provider's
canonical serving remains the nutrition basis, while the user-entered portion
is stored separately as `portion_amount`, `portion_unit`, and
`serving_equivalent`. Mass foods support safe `g`, `kg`, `oz`, and `lb`
conversion. Volume foods support safe `mL`, `L`, US `fl oz`, `cup`, `tbsp`,
and `tsp` conversion. The app does not convert mass to volume unless a
provider-defined portion relationship exists, and it does not invent household
units such as bar, slice, or bottle.

Editing a diary item recalculates from the original per-canonical-serving
snapshot instead of multiplying previous totals, so changing `50 g` to `75 g`
uses the same base nutrition values that were stored when the food was first
logged.

TASK-010.6 also improves search ergonomics without adding new providers. The
Find Food screen loads recent logged foods, debounces text search, caches
provider results by normalized query during the session, and applies lightweight
typo-tolerant ranking for common searches such as chicken breast, Greek yogurt,
banana, protein, and rice.

TASK-012 adds a lightweight food library. The Find Food screen shows favorites
when the search field is empty and lets a displayed food be favorited. The Diary
screen can log a previous entry again, save a populated meal section as a saved
meal, and open `/saved-meals`. Saved meals support rename, item removal, delete,
meal-type selection, and 0.5x/1x/2x logging. Logging a saved meal creates new
`food_logs` rows; it does not mutate the saved meal or historical diary rows.

Today's Diary is available at `/diary` from the dashboard. It groups persisted
logs by Breakfast, Lunch, Dinner, and Snacks, calculates meal totals and daily
totals from the selected local calendar day, supports item quantity, portion,
and meal edits, and confirms deletes. Empty meals show clear empty states.

Weight values are stored in metric database columns and displayed using the
profile's preferred unit system. Imperial users see pounds; metric users see
kilograms. The dashboard shows consumed / target calories and macros from
today's `food_logs` plus the active nutrition goal. Progress bars clamp at 100%
visually, while text reports over-target values instead of showing confusing
negative remaining numbers.

Platform-specific shortcuts:

```sh
pnpm mobile:ios
pnpm mobile:android
pnpm mobile:web
```

## Physical iPhone Development Build

GymApp uses Expo SDK 57. If the App Store version of Expo Go on your iPhone is
older than SDK 57, Expo Go cannot open this project. Use the GymApp
development client installed directly on the iPhone instead. This is also the
preferred path for testing native camera barcode scanning with `expo-camera`.

The repo includes an EAS development profile at `apps/mobile/eas.json`. It
creates an installable iOS development client with:

- `developmentClient: true`
- `distribution: internal`
- `ios.simulator: false`

The repo does not store Apple credentials, Expo credentials, certificates, or
provisioning profiles. It also is not linked to an Expo project in source
control. If EAS asks to create or link a project, choose the Expo account and
project that should own GymApp; do not link it to an unrelated project.

First-time EAS cloud build for a physical iPhone:

```sh
cd GymApp/apps/mobile
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest init
pnpm dlx eas-cli@latest device:create
pnpm dlx eas-cli@latest build --platform ios --profile development
```

For the EAS cloud path, you need a paid Apple Developer Program membership for
ad hoc/internal iOS installation, a registered iPhone UDID, an ad hoc
provisioning profile, and Developer Mode enabled on iOS 16 or newer. EAS can
guide you through Apple signing and device registration interactively. After
the build finishes, install it on the iPhone from the EAS build install link or
QR code.

Alternative local USB build from your Mac/Xcode:

```sh
cd GymApp/apps/mobile
pnpm exec expo run:ios --device
```

The local path requires Xcode, a paired iPhone, Developer Mode enabled, and an
Apple account added in Xcode. Xcode can usually create a development
provisioning profile automatically for a directly connected personal device.
A paid Apple Developer Program membership is still the practical requirement
for EAS cloud ad hoc distribution.

Normal daily development after the development client is installed:

```sh
cd GymApp
pnpm mobile:dev-client
```

Then open the installed GymApp development client on your iPhone. If it does
not connect automatically, use the development-client launcher to select the
Metro server from your Mac. Keep the iPhone and Mac on the same network unless
you intentionally use a tunnel.

To test the physical barcode scanner:

1. Open the installed GymApp development client on the iPhone.
2. Sign in and reach the dashboard.
3. Tap `Scan Barcode`.
4. Grant camera permission.
5. Point the physical iPhone camera at a UPC/EAN food barcode.
6. Review Product Detail and use the existing Add to Diary flow.

After native dependency or config changes, rebuild and reinstall the
development client:

```sh
cd GymApp/apps/mobile
pnpm dlx eas-cli@latest build --platform ios --profile development
```

The app config includes the iOS camera permission message:
`Allow GymApp to use your camera to scan food barcodes.`

## EAS Distribution Builds

GymApp has four EAS Build profiles:

- `development`: internal development client for Metro-backed debugging
- `development-simulator`: internal development client for the iOS Simulator
- `preview`: standalone internal iOS build for friends, testers, and demos;
  it does not require Metro, Expo Go, or the developer Mac after installation
- `production`: store/TestFlight-ready configuration without the development
  client; submission remains a separate manual command

Preview and production builds use the deployed Supabase project through these
EAS environment variables:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Create those public variables in the EAS `preview` and `production`
environments before building. Keep `FATSECRET_CLIENT_ID`,
`FATSECRET_CLIENT_SECRET`, `USDA_FDC_API_KEY`, service-role keys, and database
passwords in Supabase/server infrastructure only. They must never be EAS
mobile variables or `EXPO_PUBLIC_*` values.

Build the first standalone iOS preview version with:

```sh
cd GymApp
pnpm mobile:build:preview
```

The root build scripts switch into the `apps/mobile` workspace before EAS
resolves Expo configuration. This is required by the pnpm monorepo; do not run
EAS from the repository root directly.

EAS login and Apple signing are required. The first build may ask you to
create or link the EAS project, register the iPhone, and configure Apple
certificates. The finished installable build is independent of Metro and the
developer Mac. Do not use `mobile:submit:ios` until TestFlight submission is
intended.

EAS Update is configured with the app-version runtime policy and preview /
production channels, but no update has been published. JavaScript and asset
changes can use EAS Update only when compatible with the installed native
runtime. Native dependencies, permissions, Expo SDK changes, and native app
configuration changes require a new build.

## Quality Checks

Run all commands from the repository root.

```sh
pnpm lint
pnpm type-check
pnpm test
pnpm format:check
```

Format files with:

```sh
pnpm format
```

Package-specific nutrition checks are also available:

```sh
pnpm nutrition:type-check
pnpm nutrition:test
```

## Product Quality Notes

The dashboard uses presentation-only formatting for demo-safe nutrition
readouts. Calories are rounded to whole kcal in UI, macro values show at most
one useful decimal, and progress bars clamp visually at 100% while preserving
actual over-target values in text such as `361 kcal over target`.

Loading, empty, and error states should stay contextual: dashboard loading uses
card placeholders, empty diary days show `0 consumed` against active targets,
and retry messages should explain what failed without exposing raw backend
errors.

## Repository Structure

```text
apps/
  mobile/
    app/                  Expo Router routes
    src/
      components/         Shared mobile UI components
      features/           Feature-oriented application code
        dashboard/        Authenticated home target dashboard and settings
        diary/            Food and food-log domain/service foundation
        goals/            Editable target UI, validation, and save service
        onboarding/       Nutrition onboarding UI, validation, and save service
      hooks/              Shared React hooks
      services/           Internal service interfaces
      lib/                Shared mobile utilities
      types/              Shared mobile TypeScript types
packages/
  nutrition/              Deterministic BMR, TDEE, calorie, and macro logic
  validation/             Future shared validation schemas
  api-types/              Future shared API types
supabase/
  config.toml             Supabase local project configuration
  migrations/              PostgreSQL schema migrations and RPCs
docs/                     Supporting documentation
```

## Roadmap

- EAS preview and internal distribution
- TestFlight preparation
- Additional progress and analytics polish
- Future food-photo recognition through a server-side workflow

## License

No open-source license has been selected yet.

See `PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, and `AGENTS.md` for product and engineering requirements.
