# @gymapp/nutrition

Deterministic nutrition calculation helpers for GymApp.

## Units

Core formulas use kilograms, centimeters, years, and kcal/day. Imperial input
conversion belongs at the app boundary; small conversion helpers are exported
for future onboarding use.

## BMR

`calculateBMR` uses the Mifflin-St Jeor equation:

- male: `10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5`
- female: `10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161`

The result is rounded to the nearest whole calorie at the public API boundary.
The plan intentionally passes that displayed whole-calorie BMR into TDEE, so
the published plan is deterministic and matches the standalone BMR/TDEE
functions.

## TDEE

`calculateTDEE` multiplies BMR by the centralized activity multiplier:

- `sedentary`: `1.2`
- `lightly_active`: `1.375`
- `moderately_active`: `1.55`
- `very_active`: `1.725`
- `extremely_active`: `1.9`

The result is rounded to the nearest whole calorie.

## Calorie Targets

Maintenance uses TDEE directly.

Lose and gain goals use a weekly weight-change rate when supplied. The default
rate is a conservative `0.25 kg/week` in either direction. The energy
assumption is configurable and defaults to `7700 kcal/kg`.

Daily adjustment:

```text
weeklyRateKg * kcalPerKg / 7
```

## Macro Targets

Protein defaults to `1.8 g/kg`, a practical starting point for lifters.

Fat defaults to `0.8 g/kg`, preserving a baseline fat intake before assigning
remaining calories to carbohydrates.

Carbohydrates are calculated from the remaining calorie budget:

```text
protein calories = proteinG * 4
fat calories = fatG * 9
carbsG = (dailyCalories - protein calories - fat calories) / 4
```

Macro grams are rounded to the nearest whole gram. If protein and fat exceed
the calorie target, the package throws a typed error instead of returning
negative carbohydrates.

Provider-reported food calories remain the source of truth. Nutrition serving
calculations retain fractional precision internally; mobile presentation
formats calories to whole kcal and macros to at most one decimal place.

## Validation

Functions reject non-finite or non-positive age, height, weight, calorie, and
strategy values. Controlled values match the PostgreSQL schema:

- sex: `male`, `female`
- goal: `lose`, `maintain`, `gain`
- activity: `sedentary`, `lightly_active`, `moderately_active`, `very_active`,
  `extremely_active`

The package is pure: it does not access Supabase, React state, environment
variables, time, or external APIs.
