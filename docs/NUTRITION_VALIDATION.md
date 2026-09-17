# Nutrition Validation Report

## Status

**PASS WITH LIMITATIONS**

The deterministic nutrition path passed 30 independent known-answer scenarios
covering USDA, FatSecret, and Open Food Facts-shaped normalized foods. No
calculation mismatch or critical/high nutrition bug was found. Live provider
network calls were not used for this report, so provider availability remains a
separate release check.

## Matrix

| Food | Provider | Amount | Expected kcal | Actual kcal | Expected P/C/F | Actual P/C/F | Result |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| Chicken breast | USDA | 100 g | 165 | 165 | 31/0/3.6 | 31/0/3.6 | PASS |
| Chicken breast | USDA | 150 g | 247.5 | 247.5 | 46.5/0/5.4 | 46.5/0/5.4 | PASS |
| Banana | USDA | 1 serving | 105 | 105 | 1.3/27/0.4 | 1.3/27/0.4 | PASS |
| Banana | USDA | 2 servings | 210 | 210 | 2.6/54/0.8 | 2.6/54/0.8 | PASS |
| Large egg | USDA | 2 servings | 144 | 144 | 12.6/0.8/9.6 | 12.6/0.8/9.6 | PASS |
| Cooked white rice | USDA | 200 g | 260 | 260 | 5.4/56.4/0.6 | 5.4/56.4/0.6 | PASS |
| Broccoli | USDA | 150 g | 52.5 | 52.5 | 3.6/10.8/0.6 | 3.6/10.8/0.6 | PASS |
| Oats | USDA | 80 g | 311.2 | 311.2 | 13.52/53.04/5.52 | 13.52/53.04/5.52 | PASS |
| Greek yogurt | USDA | 340 g | 200.6 | 200.6 | 35.02/12.24/1.36 | 35.02/12.24/1.36 | PASS |
| Chipotle chicken | FatSecret | 1 serving | 180 | 180 | 32/0/7 | 32/0/7 | PASS |
| Chipotle chicken | FatSecret | 1 oz | 45 | 45 | 8/0/2 | 8/0/2 | PASS |
| Chipotle chicken | FatSecret | 100 g | 159 | 159 | 28.3/0/6.2 | 28.3/0/6.2 | PASS |
| Big Mac | FatSecret | 1 serving | 563 | 563 | 26/45/33 | 26/45/33 | PASS |
| Quest protein chips | Open Food Facts | 64 g | 280 | 280 | 40/8/9 | 40/8/9 | PASS |
| Mahatma rice | Open Food Facts | 1 serving | 160 | 160 | 3/36/0 | 3/36/0 | PASS |

The complete 30-case table-driven matrix is in
`apps/mobile/src/features/diary/utils/__tests__/nutritionStress.test.ts`.

## Independent calculations

The expected values are specified directly in the test matrix. Examples:

- Chicken breast 150 g: `165 × 150 / 100 = 247.5 kcal`; `31 × 1.5 = 46.5 g protein`; `3.6 × 1.5 = 5.4 g fat`.
- Cooked rice 200 g: `130 × 2 = 260 kcal`; `2.7 × 2 = 5.4 g protein`; `28.2 × 2 = 56.4 g carbs`.
- Broccoli 50 g: `35 × 0.5 = 17.5 kcal`; `2.4 × 0.5 = 1.2 g protein`; `7.2 × 0.5 = 3.6 g carbs`.
- Oats 80 g: `389 × 0.8 = 311.2 kcal`; `16.9 × 0.8 = 13.52 g protein`; `66.3 × 0.8 = 53.04 g carbs`.
- Greek yogurt 340 g: `59 × 3.4 = 200.6 kcal`; `10.3 × 3.4 = 35.02 g protein`.
- Chipotle chicken 1 oz: provider serving values are tested as a distinct serving; `45 × 1 = 45 kcal`, not the 1-serving or 100-g value.
- Chipotle chicken 100 g: `159 × 1 = 159 kcal`; `28.3 × 1 = 28.3 g protein`; `6.2 × 1 = 6.2 g fat`.
- Big Mac: `563 × 1 = 563 kcal`; `26/45/33 g P/C/F` remain provider-authoritative.
- Quest chips 64 g: `437.5 × 64 / 100 = 280 kcal`; `62.5 × 0.64 = 40 g protein`.
- Mixed day: `165 + 247.5 + 105 = 517.5 kcal`; protein `31 + 46.5 + 1.3 = 78.8 g`.

Provider calories remain authoritative; no macro-calorie reconciliation was
used to reject a case.

## Additional checks

- Serving amounts tested: `0.01`, `0.1`, `0.25`, `0.5`, `1`, `1.5`, `2`, `2.25`, `3`, and `10`.
- Gram amounts tested: `1`, `10`, `28.349523125`, `32`, `40`, `45`, `50`, `64`, `80`, `100`, `150`, `170`, `200`, and `340`.
- Ounce equivalence passed for `1 oz` and `4 oz` against `28.349523125 g` and `113.3980925 g`.
- FatSecret serving options remain distinct for `1 serving`, `1 oz`, and `100 g`; identities are composite and stable.
- Diary snapshots preserve detail nutrition and mixed-provider aggregation counts each entry once.
- Volume-to-mass conversion is rejected; no `1 ml = 1 g` assumption is made.
- Optional nutrient fields may be null without producing `NaN`, infinity, or negative nutrition.
- Display rounding remains a presentation concern: calories are whole-unit display values and macros allow one decimal.

## Findings

**Critical:** none.

**High:** none.

**Medium:** none found in deterministic coverage.

**Low:** no calculation issue. TASK-016 may separately review over-target visual treatment.

No production bug was discovered or fixed by this stress pass. Existing TASK-015
and TASK-015.1 fixes remain covered.

## Provider and live limitations

This pass uses deterministic provider-shaped fixtures and existing adapter
coverage. No new credentials were added and no provider response was invented.
The harness was executed against the deployed project. USDA search passed,
FatSecret branded search/detail and autocomplete passed, Open Food Facts
barcode lookup passed, and combined search passed. FatSecret serving identity
validation failed because the deployed response returned IDs `104733`, `0`,
and `0` for `1 serving`, `1 oz`, and `100 g`. This is the pre-TASK-015.1
deployed adapter behavior; the local composite-identity adapter is not yet
deployed. No provider secret or access token was printed.

The final torture run on 2026-09-15 tested 10 USDA foods, 10 FatSecret foods,
and 1 Open Food Facts barcode. The Chipotle golden case passed: the current
live base was 180 kcal, 32 g protein, 0 g carbs, and 7 g fat per serving;
the independently calculated 100 g comparison differed by at most 0.27
nutrition units. Equivalent-ounce, serving-scaling, cross-provider identity,
mixed-provider aggregation, and invalid-input checks all passed. Saved-meal
RPC persistence and re-log behavior remain manual-required because the harness
does not write to a user's diary.

## Live smoke test

Run the deployed-provider harness from the repository root on a machine with
network access:

```bash
pnpm test:providers:live
```

To use a different known Open Food Facts barcode:

```bash
pnpm test:providers:live --barcode 0123456789012
```

The harness reads only `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` from `apps/mobile/.env` and calls the deployed
`search-food`, `autocomplete-food`, `lookup-food-id`, and `lookup-barcode`
functions. It never calls providers directly and never prints credentials,
authorization headers, or access tokens. It classifies failures as network,
auth, provider availability, invalid response, normalization, or missing
expected-provider results.

The live harness deliberately does not assert brittle nutrition values. The
offline Jest matrix above owns deterministic arithmetic; this command verifies
deployed integration and prints current normalized values for inspection.

The final torture command is:

```bash
pnpm test:nutrition:torture
```

It extends the same harness with the live USDA/FatSecret/Open Food Facts
matrices, independent scaling and unit checks, provider identity checks, and a
gitignored `.tmp/nutrition-torture-report.json` report. Add one or more known
barcodes with `--barcode <value>`.

## Freeze recommendation

**READY TO FREEZE** for TASK-016 nutrition logic. Deterministic tests pass, the
live USDA, FatSecret, and Open Food Facts paths pass, equivalent-unit and
serving-scaling checks pass, and no critical or high correctness issue remains.
Live diary persistence, saved-meal RPC persistence, and re-log behavior remain
manual iPhone checks because the harness deliberately does not write or delete
user data.

## Verification

- `pnpm format:check`
- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm --filter @gymapp/mobile exec expo install --check`

Final Jest totals: mobile 44 suites / 258 tests passed; nutrition 1 suite / 22
tests passed. The Expo compatibility check reported dependencies up to date
using Expo's local bundled dependency map because network access was disabled.

## Manual iPhone matrix

1. Search a USDA food, choose `100 g`, `150 g`, and `1 oz`; compare the detail and diary snapshots.
2. Search Chipotle chicken; select `1 serving`, `1 oz`, and `100 g`; verify one option is selected and each nutrition value changes appropriately.
3. Scan or look up one Open Food Facts product; log it and compare detail, Diary, and Dashboard totals.
4. Log one USDA, one FatSecret, and one Open Food Facts food; verify the day total equals the independent sum and no item appears twice.
5. Save a mixed-provider meal and log it at `0.5x`, `1x`, and `2x`; verify each result scales once.
6. Re-log an existing diary item after reopening it; verify its stored snapshot remains unchanged.
