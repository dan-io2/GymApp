# GymApp Codex Instructions

## Project Goal

GymApp is a production-quality mobile nutrition and fitness application designed primarily for people who lift weights and want a fast, simple way to track calories and macronutrients.

The project should be built as if it could eventually support real users and be published to the Apple App Store and Google Play Store.

The application is also intended to demonstrate professional full-stack software engineering skills in a portfolio.

## Core Product Principles

The primary user workflow is:

1. Create an account.
2. Complete nutrition onboarding.
3. Calculate calorie and macronutrient targets.
4. Log food.
5. Track progress toward daily calorie, protein, carbohydrate, and fat goals.

Food should eventually be loggable through:

* Manual food search
* Barcode scanning
* Food photography
* Saved foods
* Saved meals

Do not add unrelated features unless explicitly requested.

Do not build workout tracking, social features, messaging, trainer marketplaces, or other features unless they are added to the product requirements.

## Technology Stack

Use the following stack unless explicitly instructed otherwise:

### Mobile

* React Native
* Expo
* TypeScript
* Expo Router

### Backend

* Supabase

### Database

* PostgreSQL through Supabase

### Authentication

* Supabase Auth

### Storage

* Supabase Storage

### Server-Side Logic

* Supabase Edge Functions
* TypeScript

### Validation

* Zod

### Nutrition Data

* USDA FoodData Central
* Open Food Facts

### Barcode Recognition

* Expo Camera

### AI Food Recognition

* OpenAI API through a server-side function only

### Testing

* Jest
* React Native Testing Library where appropriate

### CI

* GitHub Actions

## Architecture Requirements

Keep the application modular and scalable.

Do not place business logic directly inside React UI components.

Separate:

* UI
* domain/business logic
* API clients
* data access
* validation
* authentication
* external services

Prefer feature-based organization.

Example:

apps/mobile/
app/
src/
components/
features/
hooks/
services/
lib/
types/

packages/
nutrition/
validation/
api-types/

supabase/
migrations/
functions/

docs/

External APIs must be wrapped behind internal service interfaces.

The frontend must not depend directly on provider-specific response formats.

For example, USDA and Open Food Facts responses should both be converted into a shared internal Food model.

Never expose secret API keys in the mobile application.

OpenAI and other secret API requests must occur server-side.

## Database Standards

Use PostgreSQL migrations.

Every table should use appropriate:

* primary keys
* foreign keys
* NOT NULL constraints
* CHECK constraints
* indexes
* timestamps

Use UUIDs for application-owned entities unless there is a strong reason not to.

Use timestamptz for timestamps.

Enable Row Level Security for user-owned data.

Users must only be able to access their own private records unless a table is explicitly designed as shared/public data.

Do not modify production schemas manually when a migration should be created instead.

## Nutrition Data Rules

Nutrition calculations should be deterministic and testable.

Do not ask an AI model to calculate standard arithmetic that can be calculated locally.

AI food-photo recognition should identify likely foods and estimated portions.

Verified nutrition data should come from trusted food databases whenever possible.

Users must be able to review and modify AI-estimated food information before adding it to their food diary.

Food log entries should snapshot important nutritional values at the time of logging so historical logs do not change if a source food record later changes.

## TypeScript Standards

Use TypeScript strict mode.

Avoid `any`.

Prefer explicit interfaces/types for domain entities.

Validate untrusted external data.

Use Zod when appropriate for:

* API responses
* form validation
* environment variables
* server requests

Use clear, descriptive names.

Keep functions small and focused.

Avoid unnecessary abstraction.

Do not duplicate business logic.

## UI Standards

Build reusable components where appropriate.

Every networked screen should account for:

* loading state
* empty state
* error state
* success state

Prioritize mobile usability.

Accessibility should be considered when creating buttons, forms, labels, and touch targets.

Do not hardcode nutrition values or fake backend data in production paths.

Mock data is acceptable in tests and explicitly marked development fixtures.

## Security Rules

Never commit secrets.

Never place private API keys in Expo public environment variables.

Provide `.env.example` files containing variable names only.

Validate user input.

Use Supabase Row Level Security.

Sensitive server-side operations belong in Edge Functions.

Do not log passwords, auth tokens, API keys, or unnecessary personal information.

## Git / Change Standards

Work on only the requested task.

Do not implement future TASKS.md tasks unless required for the current task.

Avoid unrelated refactors.

Before finishing a task:

1. Run formatting.
2. Run linting.
3. Run TypeScript checking.
4. Run relevant tests.
5. Fix failures caused by the change.

Report:

* files created
* files modified
* architectural decisions
* tests run
* remaining limitations

Do not claim tests passed unless they were actually run.

## Documentation

Keep documentation synchronized with major architectural changes.

Important documentation:

* README.md
* PRODUCT_REQUIREMENTS.md
* ARCHITECTURE.md
* TASKS.md

If implementation changes an architectural assumption, update ARCHITECTURE.md.

## Task Execution

Before writing code:

1. Read AGENTS.md.
2. Read the relevant sections of PRODUCT_REQUIREMENTS.md.
3. Read ARCHITECTURE.md.
4. Read the current task in TASKS.md.
5. Inspect existing code before changing it.

When requirements are ambiguous, choose the simplest scalable implementation consistent with these documents.

Do not redesign the entire architecture for a single feature.

## Current Development Philosophy

Build vertically and incrementally.

A working small feature is preferable to a partially implemented large system.

The intended development order is:

Foundation
→ Authentication
→ Database
→ Onboarding
→ Macro Calculator
→ Dashboard
→ Food Search
→ Food Diary
→ Barcode Scanner
→ AI Food Recognition
→ Progress Tracking
→ Production Polish
