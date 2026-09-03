# GymApp Product Requirements

## Product Summary

GymApp is a mobile nutrition-tracking application aimed at gym users who want straightforward access to calorie and macronutrient tracking without requiring a premium subscription for core functionality.

The product focuses on making food logging extremely fast while giving users clear daily targets for:

* Calories
* Protein
* Carbohydrates
* Fat

## Primary User

The initial target user is someone who:

* regularly exercises or lifts weights
* wants to gain muscle, lose weight, or maintain weight
* cares about protein intake
* wants to track calories and macronutrients
* wants faster food logging than manually entering every nutrition label

## Core User Flow

A new user should be able to:

Create Account
→ Complete Nutrition Profile
→ Select Goal
→ Receive Calorie/Macro Targets
→ Reach Dashboard
→ Log Food
→ See Remaining Daily Macros

## MVP Features

### 1. Authentication

Users must be able to:

* Create an account with email/password
* Log in
* Log out
* Maintain an authenticated session
* Access protected application screens only while authenticated

Future versions may add:

* Apple Sign In
* Google Sign In

### 2. User Nutrition Profile

Collect:

* Date of birth or age
* Sex used for calorie calculation
* Height
* Current body weight
* Activity level

Support metric and US customary display units where practical.

Store normalized measurements internally using metric units.

### 3. Goals

User can select:

* Lose weight
* Maintain weight
* Gain weight / muscle

The application should calculate recommended:

* Daily calories
* Protein grams
* Carbohydrate grams
* Fat grams

Users should be able to manually override calculated targets.

### 4. Macro Calculator

The calculator should estimate:

* Basal metabolic rate
* Total daily energy expenditure
* Goal-adjusted calorie target
* Protein target
* Fat target
* Carbohydrate target

Calculation logic must exist outside UI components and have automated tests.

### 5. Dashboard

Show today's:

* Calories consumed / target
* Protein consumed / target
* Carbohydrates consumed / target
* Fat consumed / target

Also show remaining values.

Protein should receive strong visual emphasis because it is particularly important to the target audience.

### 6. Food Diary

Organize food into:

* Breakfast
* Lunch
* Dinner
* Snacks

Users should be able to:

* Add food
* Change item quantity and portion/serving amount
* Remove a logged item
* View meal totals
* View daily totals

### 7. Food Search

Users should be able to search for common foods.

Primary nutrition provider:

USDA FoodData Central.

External provider responses should be transformed into the application's normalized Food model.

Search should feel forgiving for common food terms. The app may use recent
logs, debounce, session-level caching, and typo-tolerant ranking as long as
provider integrations remain wrapped behind internal services.

### 8. Barcode Scanner

Users should be able to:

1. Open the scanner.
2. Scan UPC/EAN barcodes.
3. Retrieve matching product information.
4. Review nutrition information.
5. Change serving quantity.
6. Add the food to a meal.

Primary packaged-food provider:

Open Food Facts.

Barcode detection should use Expo Camera.

### 9. Food Photo Recognition

Users should eventually be able to photograph a meal.

The system should:

1. Upload the image securely.
2. Analyze the image server-side.
3. Identify likely foods.
4. Estimate approximate portions.
5. Match identified foods against nutrition data where possible.
6. Display editable results.
7. Require confirmation before logging.

AI results must be described to users as estimates.

### 10. Weight / Progress Tracking

Users should eventually be able to:

* Record body weight
* View weight history
* View trend charts
* Compare current weight with target weight

## Food Model

The application should use a normalized food representation similar to:

* id
* externalId
* source
* barcode
* name
* brand
* servingSize
* servingUnit
* calories
* proteinG
* carbsG
* fatG
* fiberG
* sugarG
* sodiumMg

Sources may include:

* USDA
* Open Food Facts
* User-created foods
* AI-assisted matches

## Food Logging Requirement

Food log records should store both:

* a reference to the source food when available
* a snapshot of important nutrition information when logged
* the physical item quantity when applicable
* the portion amount/unit and calculated serving equivalent used for nutrition totals

Historical food logs must not unexpectedly change because an external food database updates a food record.

## Out of Scope for Initial MVP

Do NOT initially build:

* Workout tracking
* Exercise programming
* Social feeds
* Direct messages
* Trainer marketplace
* Wearable integrations
* AI personal trainer
* Grocery ordering
* Complex meal planning
* Supplement marketplace

These may be evaluated after the core nutrition product is complete.

## MVP Success Definition

The MVP is complete when a user can:

1. Register.
2. Configure a nutrition goal.
3. Receive macro targets.
4. Search for a food.
5. Scan a packaged food barcode.
6. Add food to their diary.
7. See daily nutrition totals.
8. Record body weight.

AI photo recognition may ship immediately after the core MVP if necessary.
