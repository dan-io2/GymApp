# GymApp Development Tasks

Do tasks in numerical order unless explicitly instructed otherwise.

Do not automatically implement later tasks.

---

## TASK-001 — Repository and Mobile Foundation

Status: READY

Goal:

Create the initial production-quality repository and Expo mobile application.

Requirements:

- Initialize Git repository if necessary.
- Create an Expo React Native application.
- Use TypeScript.
- Enable strict TypeScript configuration.
- Configure Expo Router.
- Configure linting.
- Configure formatting.
- Add Jest.
- Add React Native Testing Library if compatible with the selected Expo version.
- Create initial feature-oriented source structure.
- Create `.env.example`.
- Create `.gitignore`.
- Add basic development scripts.
- Create a minimal home/welcome screen proving the application runs.
- Do not implement authentication.
- Do not implement Supabase yet.
- Do not implement nutrition functionality yet.
- Do not implement external APIs.

Add documentation explaining:

- dependency installation
- development server command
- test command
- lint command
- type-check command

Acceptance criteria:

- Application boots successfully.
- TypeScript works in strict mode.
- Lint passes.
- Type checking passes.
- Tests pass.
- No secrets are committed.

---

## TASK-002 — Supabase Local/Client Foundation

Status: BLOCKED BY TASK-001

Implement Supabase client configuration and environment validation.

Do not implement authentication UI yet.

---

## TASK-003 — Authentication

Status: COMPLETE

Implement:

- registration
- login
- logout
- persistent session
- protected routes

---

## TASK-004 — Initial PostgreSQL Schema, Profile Creation, and Onboarding Routing Foundation

Status: COMPLETE

Create migrations for:

- profiles
- nutrition_goals
- body_metrics

Add appropriate Row Level Security policies.

Add automatic profile creation for new Supabase Auth users, backfill missing
profiles for existing Auth users, and route authenticated users by
`profiles.onboarding_completed`.

Authenticated routing behavior:

- missing or unloadable profile -> safe profile status screen
- onboarding incomplete -> onboarding placeholder
- onboarding complete -> authenticated home placeholder

Do not implement the real nutrition onboarding form until TASK-006.

---

## TASK-005 — Nutrition Calculation Package

Status: COMPLETE

Create domain functions for:

- BMR
- TDEE
- calorie goal
- macro targets

Add comprehensive unit tests.

---

## TASK-006 — Nutrition Onboarding

Status: COMPLETE

Create onboarding for:

- age/date of birth
- sex used for calculation
- height
- weight
- activity
- goal

Store profile and calculated targets.

Support imperial and metric input, normalize saved values to metric, calculate
targets through `@gymapp/nutrition`, save onboarding atomically through the
`complete_nutrition_onboarding` RPC, and create an initial same-day body metric
without duplicating retry submissions.

---

## TASK-007 — Dashboard

Status: COMPLETE

Display daily:

- calories
- protein
- carbohydrates
- fats

TASK-007 initially displayed target values only. TASK-010 updates the
authenticated home dashboard to combine the active nutrition goal with today's
food logs for consumed/remaining progress.

---

## TASK-008 — Editable Nutrition Goals + Food Model + Food Diary Foundation

Status: COMPLETE

Create:

- editable nutrition targets
- atomic active goal replacement
- recommended vs custom target source
- foods
- food_logs

Include nutrition snapshots in food_logs.

Add appropriate indexes and RLS.

TASK-008 includes domain and service utilities for food identifiers, meal types,
serving quantity snapshots, daily totals, remaining targets, and local-day
ranges. It does not implement USDA/Open Food Facts integrations, barcode
scanning, search UI, full diary UI, AI recognition, or consumed dashboard
progress.

---

## TASK-009 — Food Search + Manual Barcode Lookup + Provider ID Lookup

Status: COMPLETED

Implemented server-side USDA FoodData Central search and FDC ID lookup.

Implemented server-side Open Food Facts manual UPC/EAN barcode lookup.

Normalized provider data into the internal food lookup model before returning
results to the mobile app.

Added a Find Food mobile route for text search, manual barcode lookup, USDA FDC
ID lookup, result detail display, and loading/empty/error states.

Camera barcode scanning, diary insertion, saved meals, recipes, consumed
dashboard totals, and AI recognition are not part of this task.

---

## TASK-010 — Add Food to Diary + Today's Diary + Consumed/Remaining Nutrition

Status: COMPLETED

Implemented real Add to Diary flow from normalized food lookup results.

Implemented meal selection, decimal serving quantity, nutrition preview,
persisted `food_logs` insertion, Today's Diary grouping, daily totals,
remaining/over-target progress, edit quantity/meal, delete confirmation, and
dashboard consumed/target updates.

Added a minimal migration for per-serving food log snapshots so edits
recalculate from original serving nutrition.

Camera barcode scanning, recipes, saved meals, and AI recognition are not part
of this task.

TASK-010 follow-up fix: Open Food Facts and USDA provider normalization now
keeps nutrition basis explicit. Open Food Facts per-100g values are converted to
one serving only when a gram serving size is known, explicit per-serving fields
are preserved, and `servingsPerContainer` is treated only as package metadata.
Quest Protein Chips and Mahatma rice regression coverage verifies that one
serving, fractional servings, multiple servings, and full-container quantities
produce expected diary totals.

TASK-010.5 follow-up: Add to Diary now supports flexible portion entry with
safe unit conversion. Canonical serving nutrition remains unchanged, while
user-entered `portion_amount`, `portion_unit`, and `serving_equivalent` are
snapshotted on `food_logs`. Mass conversion supports `g`, `kg`, `oz`, and `lb`.
Volume conversion supports `mL`, `L`, US `fl oz`, `cup`, `tbsp`, and `tsp`.
Provider-defined household units are only exposed when explicitly present in
serving metadata, and mass-volume conversion is not guessed.

TASK-010.6 follow-up: Add to Diary now separates physical `item_quantity` from
portion amount/unit and serving equivalent. This supports logs such as
`3 x 1 banana`, `2 x 1 chicken breast`, and `8 x 1 packaged serving` without
creating multiple diary rows or confusing package serving counts with consumed
quantity. Search now loads recent logged foods, debounces text input, caches
provider searches during the session, and applies lightweight typo-tolerant
ranking while preserving the existing USDA/Open Food Facts provider
architecture.

---

## TASK-011 — Physical Camera Barcode Scanner

Status: COMPLETED

Implemented an Expo Camera scanner at `/scan` for physical UPC/EAN barcodes.
The dashboard exposes a prominent Scan Barcode action. The scanner handles
camera permission states, denied-permission recovery, flash toggle, scan-again
recovery, manual barcode fallback, and duplicate scan protection.

Detected barcode strings are passed into the existing barcode lookup service,
which calls the existing `lookup-barcode` Edge Function and Open Food Facts
adapter. Successful scans open the shared Product Detail component and then the
existing Add to Diary flow. No second food lookup system was created.

---

## TASK-012 — Favorites + Saved Meals + One-Tap Re-Log

Status: COMPLETED

Implemented reusable food-library features:

- favorite foods through `public.favorite_foods`
- favorites displayed in Find Food
- user-owned normalized food copies for provider results that do not already
  have a `food_id`
- one-tap re-log from existing immutable `food_logs` snapshots
- saved meal creation from populated diary meal sections
- saved meal list/detail screen at `/saved-meals`
- rename, item removal, delete, meal-type selection, and 0.5x/1x/2x logging
- atomic saved-meal logging through `public.log_saved_meal`

The task does not add FatSecret, photo recognition, recipes, OpenAI
integration, or new nutrition providers.

---

## TASK-013 — FatSecret Premier Provider + Multi-Provider Search Ranking

Status: COMPLETED

Implemented FatSecret Premier as a third provider for restaurant and branded
foods. Supabase Edge Functions acquire FatSecret OAuth 2.0 client-credentials
tokens server-side, cache tokens until shortly before expiry, and call current
FatSecret search, autocomplete, and food detail endpoints without exposing
credentials to the mobile app.

`search-food` now merges FatSecret and USDA normalized results with
deterministic provider-aware ranking and duplicate suppression. FatSecret food
detail preserves multiple serving options for Add to Diary. The Product ID flow
supports both USDA FDC IDs and FatSecret Food IDs. Existing Open Food Facts
barcode lookup remains unchanged; FatSecret barcode fallback is intentionally
left for a smaller follow-up.

No photo recognition or OpenAI integration is part of this task.

---

## TASK-013.5 — Multi-Provider Search Ranking + Free-Text Search Behavior + Provider Resilience Polish

Status: COMPLETED

Free-text search can be submitted from the current input with either the
Search button or keyboard Return; autocomplete selection remains optional.
Search normalization handles whitespace, punctuation/spacing variants for a
small set of restaurant aliases, and high-confidence typo corrections without
replacing the user's visible text.

Restaurant intent ranking rewards matching brand tokens and relevant FatSecret
results while preserving USDA priority for generic foods. Multi-provider
search remains non-blocking when one provider fails, and the mobile session
cache expires after five minutes. Provider source labels remain visible on
search result cards. Tests cover the free-text alias matrix, branded ranking,
generic USDA ranking, Return submission, and the existing partial-provider
fallback contract.

No photo recognition, new nutrition provider, or unrelated UI feature is part
of this task.

---

## TASK-014 — Saved Foods / Meals

Status: COMPLETED AS TASK-012

Reusable favorite foods, saved meals, and one-tap re-log were implemented in
TASK-012. Future recipe-level functionality should be defined as a separate
task before implementation.

---

## TASK-015 — Weight Progress

Status: BLOCKED BY TASK-004

Implement:

- weight entries
- history
- trend visualization
- goal progress

---

## TASK-016 — Image Upload Pipeline

Status: BLOCKED BY TASK-003

Implement secure food-image upload using Supabase Storage.

No AI analysis yet.

---

## TASK-017 — AI Food Recognition

Status: BLOCKED BY TASK-016 AND TASK-009

Implement server-side OpenAI image analysis.

Return structured food candidates.

Attempt to match candidates to verified nutrition records.

Require user confirmation.

---

## TASK-018 — Caching and API Reliability

Status: BLOCKED BY TASK-013

Add reasonable:

- caching
- retry behavior
- provider error handling
- request validation
- rate-limit protection

---

## TASK-019 — CI

Status: BLOCKED BY TASK-001

Configure GitHub Actions to run:

- lint
- type checking
- tests

---

## TASK-020 — Production Polish

Status: BLOCKED BY CORE MVP

Review:

- accessibility
- performance
- errors
- empty states
- loading states
- security
- database indexes
- README
- architecture documentation
- screenshots/demo documentation

Dashboard quality-pass note:

- responsive consumed/target layouts avoid cramped slash strings
- calories display as whole kcal while stored values keep precision
- macro displays use at most one useful decimal
- over-target values show `over target` wording
- progress fills clamp visually to 100% while preserving actual overage text
- loading/error conventions should remain contextual and workflow-specific
