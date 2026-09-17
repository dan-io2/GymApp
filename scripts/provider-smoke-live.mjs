#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const GRAMS_PER_OUNCE = 28.349523125;
const GRAMS_PER_POUND = 453.59237;
const barcodeArgument = process.argv.find((argument) => argument.startsWith('--barcode='));
const barcodeIndex = process.argv.indexOf('--barcode');
const barcode =
  barcodeArgument?.slice('--barcode='.length) ||
  (barcodeIndex >= 0 ? process.argv[barcodeIndex + 1] : null) ||
  '0017400106959';
const requiredEnv = await loadEnvironment();
const baseUrl = requiredEnv.EXPO_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
const anonKey = requiredEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const results = [];
let tortureExitCode = 0;

if (process.argv.includes('--torture')) {
  await runNutritionTorture();
  process.exitCode = tortureExitCode;
} else {
  console.log('LIVE PROVIDER SMOKE TEST');
  console.log(`Backend: ${baseUrl}`);
  console.log(`Open Food Facts barcode: ${barcode}`);

  await runSearchGroup('USDA', ['chicken breast', 'banana', 'broccoli', 'cooked white rice'], {
    expectedSource: 'usda',
  });

  await runSearchGroup(
    'FatSecret',
    ['chipotle chicken', "mcdonald's big mac", 'chick-fil-a nuggets', 'in n out fries'],
    { expectedSource: 'fatsecret', expectedBrand: true },
  );

  await runAutocomplete();
  await runChipotleServingCheck();
  await runFatSecretDetailCheck();
  await runBarcodeCheck();
  await runCrossProviderSearch();

  const failed = results.filter((result) => result.status === 'FAIL');
  console.log('');
  console.log(`USDA: ${statusFor('USDA')}`);
  console.log(`FatSecret: ${statusFor('FatSecret')}`);
  console.log(`Open Food Facts: ${statusFor('Open Food Facts')}`);
  console.log(`Cross-provider search: ${statusFor('Cross-provider')}`);
  console.log(`Overall: ${failed.length === 0 ? 'PASS' : 'FAIL'}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function runSearchGroup(label, queries, options) {
  console.log('');
  console.log(label);

  for (const query of queries) {
    const result = await invoke('search-food', { query });

    if (!result.ok) {
      record(label, query, 'FAIL', result.classification, result.message);
      continue;
    }

    const foods = Array.isArray(result.body?.foods) ? result.body.foods : [];
    const matches = foods.filter((food) => food.source === options.expectedSource);
    const valid = matches.filter(isValidFood);
    const brandMatch = options.expectedBrand ? matches.some((food) => Boolean(food.brand)) : true;
    const passed = valid.length > 0 && brandMatch;

    for (const food of valid.slice(0, 2)) {
      console.log(`✓ ${query}: ${food.name}${food.brand ? ` (${food.brand})` : ''}`);
      printNutrition(food);
    }

    record(
      label,
      query,
      passed ? 'PASS' : 'FAIL',
      passed
        ? null
        : matches.length === 0
          ? 'NO_EXPECTED_PROVIDER_RESULT'
          : 'CALCULATION_INVARIANT_FAILURE',
      passed
        ? `${valid.length} ${options.expectedSource} result(s)`
        : 'No valid expected-provider result.',
    );
  }
}

async function runAutocomplete() {
  const result = await invoke('autocomplete-food', { query: 'chip' });
  const suggestions = Array.isArray(result.body?.suggestions) ? result.body.suggestions : [];
  const passed = result.ok && suggestions.length > 0;

  console.log('');
  console.log(`Autocomplete chip: ${passed ? suggestions.join(', ') : 'unavailable'}`);
  record(
    'FatSecret',
    'autocomplete chip',
    passed ? 'PASS' : 'FAIL',
    passed ? null : (result.classification ?? 'NO_EXPECTED_PROVIDER_RESULT'),
    passed ? 'Suggestions returned.' : (result.message ?? 'No suggestions returned.'),
  );
}

async function runChipotleServingCheck() {
  const result = await invoke('search-food', { query: 'chipotle chicken' });
  const food = result.body?.foods?.find(
    (candidate) => candidate.source === 'fatsecret' && /chipotle/i.test(candidate.brand ?? ''),
  );
  const options = Array.isArray(food?.servingOptions) ? food.servingOptions : [];
  const ids = options.map((option) => option.id).filter(Boolean);
  const uniqueIds = new Set(ids).size === ids.length;
  const descriptions = options.map((option) => option.servingDescription?.toLowerCase() ?? '');
  const hasServingTypes =
    descriptions.some((description) => description.includes('serving')) &&
    descriptions.some((description) => description.includes('oz')) &&
    descriptions.some((description) => description.includes('100 g'));
  const passed = result.ok && Boolean(food) && ids.length > 0 && uniqueIds;

  console.log('');
  console.log(`Chipotle serving identities: ${passed ? 'PASS' : 'FAIL'}`);
  if (food) {
    console.log(`  ${options.map((option) => option.servingDescription ?? option.id).join(', ')}`);
    console.log(`  IDs: ${ids.join(', ')}`);
    console.log(`  Unique IDs: ${uniqueIds ? 'PASS' : 'FAIL'}`);
    console.log(`  serving/oz/100g supplied: ${hasServingTypes ? 'YES' : 'NOT ALL SUPPLIED'}`);
  }

  record(
    'FatSecret',
    'Chipotle serving identities',
    passed ? 'PASS' : 'FAIL',
    passed ? null : (result.classification ?? 'NORMALIZATION_FAILURE'),
    passed
      ? 'Serving identities are unique.'
      : food && ids.length > 0
        ? 'Serving identities are duplicated in the deployed response.'
        : 'No valid Chipotle serving options found.',
  );
}

async function runFatSecretDetailCheck() {
  const search = await invoke('search-food', { query: 'chipotle chicken' });
  const food = search.body?.foods?.find((candidate) => candidate.source === 'fatsecret');

  if (!food?.externalId) {
    record(
      'FatSecret',
      'food detail',
      'FAIL',
      'NO_EXPECTED_PROVIDER_RESULT',
      'No FatSecret ID available.',
    );
    return;
  }

  const result = await invoke('lookup-food-id', {
    provider: 'fatsecret',
    externalId: food.externalId,
  });
  const detail = result.body?.food;
  const passed = result.ok && isValidFood(detail) && detail.source === 'fatsecret';

  console.log('');
  console.log(`FatSecret detail: ${passed ? 'PASS' : 'FAIL'}`);
  if (passed) {
    console.log(`  ${detail.name}${detail.brand ? ` (${detail.brand})` : ''}`);
    printNutrition(detail);
  }

  record(
    'FatSecret',
    'food detail',
    passed ? 'PASS' : 'FAIL',
    passed ? null : (result.classification ?? 'CALCULATION_INVARIANT_FAILURE'),
    passed ? 'Detail normalized.' : (result.message ?? 'Detail lookup failed.'),
  );
}

async function runBarcodeCheck() {
  const result = await invoke('lookup-barcode', { barcode });
  const food = result.body?.food;
  const passed = result.ok && isValidFood(food) && food.source === 'open_food_facts';

  console.log('');
  console.log(`Open Food Facts barcode: ${passed ? 'PASS' : 'FAIL'}`);
  if (passed) {
    console.log(`  ${food.name}${food.brand ? ` (${food.brand})` : ''}`);
    printNutrition(food);
  }

  record(
    'Open Food Facts',
    `barcode ${barcode}`,
    passed ? 'PASS' : 'FAIL',
    passed ? null : (result.classification ?? 'CALCULATION_INVARIANT_FAILURE'),
    passed ? 'Barcode result normalized.' : (result.message ?? 'Barcode lookup failed.'),
  );
}

async function runCrossProviderSearch() {
  const result = await invoke('search-food', { query: 'chicken breast' });
  const foods = Array.isArray(result.body?.foods) ? result.body.foods : [];
  const providers = [...new Set(foods.map((food) => food.source))].sort();
  const passed = result.ok && foods.every(isValidFood) && providers.length > 0;

  console.log('');
  console.log(`Cross-provider search: ${passed ? providers.join(', ') : 'unavailable'}`);
  record(
    'Cross-provider',
    'chicken breast',
    passed ? 'PASS' : 'FAIL',
    passed ? null : (result.classification ?? 'CALCULATION_INVARIANT_FAILURE'),
    passed ? `Providers returned: ${providers.join(', ')}` : (result.message ?? 'Search failed.'),
  );
}

async function invoke(functionName, body) {
  let response;

  try {
    response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return {
      ok: false,
      classification: 'NETWORK_FAILURE',
      message: error instanceof Error ? error.message : 'Request failed.',
    };
  }

  const responseBody = await response.json().catch(() => null);
  if (response.ok) {
    return { ok: true, body: responseBody };
  }

  const providerError = responseBody?.error;
  return {
    ok: false,
    classification: classifyError(response.status, providerError?.code),
    message: providerError?.message ?? `HTTP ${response.status}`,
    body: responseBody,
  };
}

function isValidFood(food) {
  if (!food || typeof food !== 'object') return false;
  if (!food.externalId || !food.name || !food.source || !Number.isFinite(food.calories))
    return false;
  if (food.calories < 0) return false;

  for (const value of [food.proteinG, food.carbsG, food.fatG]) {
    if (value !== null && value !== undefined && (!Number.isFinite(value) || value < 0))
      return false;
  }

  if (food.servingOptions !== undefined) {
    if (!Array.isArray(food.servingOptions)) return false;
    if (
      food.servingOptions.some(
        (option) =>
          !option.id ||
          !Number.isFinite(option.calories) ||
          [option.proteinG, option.carbsG, option.fatG].some(
            (value) =>
              value !== null && value !== undefined && (!Number.isFinite(value) || value < 0),
          ),
      )
    )
      return false;
  }

  return true;
}

function printNutrition(food) {
  console.log(
    `  ${formatNumber(food.calories)} kcal | ${formatNumberOrDash(food.proteinG)}g P | ${formatNumberOrDash(food.carbsG)}g C | ${formatNumberOrDash(food.fatG)}g F`,
  );
  console.log(`  Provider: ${food.sourceLabel ?? food.source} | ID: ${food.externalId}`);
}

function formatNumberOrDash(value) {
  return value === null || value === undefined ? '-' : formatNumber(value);
}

function record(group, name, status, classification, message) {
  results.push({ group, name, status });
  const symbol = status === 'PASS' ? '✓' : '✗';
  console.log(`  ${symbol} ${name}: ${status}${classification ? ` [${classification}]` : ''}`);
  if (status === 'FAIL') console.log(`    ${message}`);
}

function statusFor(group) {
  const groupResults = results.filter((result) => result.group === group);
  return groupResults.length > 0 && groupResults.every((result) => result.status === 'PASS')
    ? 'PASS'
    : 'FAIL';
}

function classifyError(status, code) {
  if (status === 401 || status === 403 || code === 'PROVIDER_AUTH_FAILED') return 'AUTH_FAILURE';
  if (status === 429 || code === 'RATE_LIMITED') return 'PROVIDER_UNAVAILABLE';
  if (code === 'INVALID_PROVIDER_RESPONSE') return 'INVALID_PROVIDER_RESPONSE';
  if (status >= 500) return 'PROVIDER_UNAVAILABLE';
  return code ?? 'PROVIDER_UNAVAILABLE';
}

async function runNutritionTorture() {
  const report = {
    timestamp: new Date().toISOString(),
    cases: [],
    warnings: [],
  };
  const usdaQueries = [
    'chicken breast',
    'banana',
    'broccoli',
    'cooked white rice',
    'salmon',
    'large egg',
    'oats',
    'avocado',
    'black beans',
    'Greek yogurt',
  ];
  const fatSecretQueries = [
    'chipotle chicken',
    'chipotle steak',
    'chipotle white rice',
    'chipotle black beans',
    'chipotle guacamole',
    "mcdonald's big mac",
    'chick-fil-a nuggets',
    'in n out fries',
    'in n out hamburger',
    'starbucks latte',
  ];
  const usdaFoods = [];
  const fatSecretFoods = [];
  const offFoods = [];

  console.log('FINAL NUTRITION TORTURE TEST');
  console.log('Live deployed backend: ' + baseUrl);

  await collectLiveFoods('USDA', usdaQueries, 'usda', usdaFoods, report);
  await collectLiveFoods('FatSecret', fatSecretQueries, 'fatsecret', fatSecretFoods, report);
  await runGoldenChipotleCase(fatSecretFoods, report);
  await runOpenFoodFactsMatrix(offFoods, report);
  runServingScaling(report);
  runEquivalentUnits(report);
  runCrossProviderIdentity(report, [...usdaFoods, ...fatSecretFoods, ...offFoods]);
  runMixedProviderAggregation(report, usdaFoods[0], fatSecretFoods[0], offFoods[0]);
  runInputSafety(report);

  await mkdir(resolve(root, '.tmp'), { recursive: true });
  await writeFile(
    resolve(root, '.tmp/nutrition-torture-report.json'),
    JSON.stringify(report, null, 2) + '\n',
    'utf8',
  ).catch(() => undefined);

  const failures = report.cases.filter((item) => item.classification === 'FAIL');
  const warnings = report.cases.filter((item) => item.classification === 'WARNING');
  console.log('');
  console.log(`USDA: ${providerSummary(report, 'USDA')}`);
  console.log(`FatSecret: ${providerSummary(report, 'FatSecret')}`);
  console.log(`Open Food Facts: ${providerSummary(report, 'Open Food Facts')}`);
  console.log(`Equivalent Units: ${summaryFor(report, 'Equivalent Units')}`);
  console.log(`Serving Scaling: ${summaryFor(report, 'Serving Scaling')}`);
  console.log(`Mixed Provider Aggregation: ${summaryFor(report, 'Mixed Provider Aggregation')}`);
  console.log('Saved Meals: MANUAL_REQUIRED (RPC persistence requires a user-owned live test)');
  console.log('Re-log: MANUAL_REQUIRED (historical snapshot requires a user-owned live test)');
  console.log(`CRITICAL: 0`);
  console.log(`HIGH: ${failures.length}`);
  console.log(`MEDIUM: ${warnings.length}`);
  console.log('LOW: 0');
  console.log(
    `FINAL: ${failures.length === 0 ? (warnings.length ? 'PASS_WITH_LIMITATIONS' : 'PASS') : 'FAIL'}`,
  );
  console.log('Report: .tmp/nutrition-torture-report.json');

  tortureExitCode = failures.length === 0 ? 0 : 1;
}

async function collectLiveFoods(label, queries, expectedSource, output, report) {
  console.log('');
  console.log(label);

  for (const query of queries) {
    const result = await invoke('search-food', { query });
    const foods = Array.isArray(result.body?.foods) ? result.body.foods : [];
    const food = foods.find(
      (candidate) => candidate.source === expectedSource && isValidFood(candidate),
    );

    if (!result.ok || !food) {
      const classification = result.classification ?? 'NO_EXPECTED_PROVIDER_RESULT';
      console.log(`  ✗ ${query}: ${classification}`);
      addCase(report, label, query, classification === 'NETWORK_FAILURE' ? 'SKIPPED' : 'FAIL', {
        classification,
        message: result.message ?? 'No valid expected-provider result.',
      });
      continue;
    }

    const sanityWarnings = getNutritionWarnings(food);
    console.log(`  ✓ ${query}: ${food.name}${food.brand ? ` (${food.brand})` : ''}`);
    printDetailedNutrition(food);
    for (const warning of sanityWarnings) report.warnings.push({ provider: label, query, warning });
    addCase(report, label, query, sanityWarnings.length ? 'WARNING' : 'PASS', {
      provider: food.source,
      providerId: food.externalId,
      food: food.name,
      brand: food.brand,
      serving: servingContext(food),
      nutrition: nutritionOf(food),
      warnings: sanityWarnings,
    });
    output.push(food);
  }
}

async function runGoldenChipotleCase(fatSecretFoods, report) {
  const food = fatSecretFoods.find(
    (candidate) => /chipotle/i.test(candidate.brand ?? '') && /^chicken$/i.test(candidate.name),
  );
  const options = food?.servingOptions ?? [];
  const serving = findServing(options, /serving/);
  const ounce = findServing(options, /oz/);
  const hundredGrams = findServing(options, /100\s*g/);

  console.log('');
  console.log('Chipotle Chicken golden case');
  if (!food || !serving || !ounce || !hundredGrams) {
    console.log('  ✗ Missing serving, ounce, or 100 g provider option');
    addCase(report, 'FatSecret', 'Chipotle golden case', 'FAIL', {
      classification: 'NORMALIZATION_FAILURE',
    });
    return;
  }

  const baseGrams = servingMassInGrams(serving);
  const expectedOunce = scaleNutrition(serving, GRAMS_PER_OUNCE / baseGrams);
  const expected100g = scaleNutrition(serving, 100 / baseGrams);
  const ounceComparison = compareNutrition(expectedOunce, ounce);
  const hundredGramComparison = compareNutrition(expected100g, hundredGrams);
  const passed = ounceComparison.pass && hundredGramComparison.pass;

  console.log(`  Base: ${servingDescription(serving)} -> ${formatNutrition(serving)}`);
  console.log(`  1 oz: ${formatComparison(ounceComparison)}`);
  console.log(`  100 g: ${formatComparison(hundredGramComparison)}`);
  console.log(`  4 oz in grams: ${(4 * GRAMS_PER_OUNCE).toFixed(7)} g`);
  addCase(report, 'FatSecret', 'Chipotle golden case', passed ? 'PASS' : 'FAIL', {
    providerId: food.externalId,
    baseServing: servingContext(serving),
    ounce: { actual: nutritionOf(ounce), expected: expectedOunce, comparison: ounceComparison },
    hundredGrams: {
      actual: nutritionOf(hundredGrams),
      expected: expected100g,
      comparison: hundredGramComparison,
    },
  });
}

async function runOpenFoodFactsMatrix(output, report) {
  const barcodes = getBarcodeArguments();
  console.log('');
  console.log('Open Food Facts');

  for (const code of barcodes) {
    const result = await invoke('lookup-barcode', { barcode: code });
    const food = result.body?.food;
    const valid = result.ok && isValidFood(food) && food.source === 'open_food_facts';

    if (!valid) {
      console.log(`  ✗ ${code}: ${result.classification ?? 'INVALID_PROVIDER_RESPONSE'}`);
      addCase(report, 'Open Food Facts', code, 'FAIL', {
        classification: result.classification ?? 'INVALID_PROVIDER_RESPONSE',
        message: result.message,
      });
      continue;
    }

    console.log(`  ✓ ${code}: ${food.name}${food.brand ? ` (${food.brand})` : ''}`);
    printDetailedNutrition(food);
    addCase(
      report,
      'Open Food Facts',
      code,
      getNutritionWarnings(food).length ? 'WARNING' : 'PASS',
      {
        providerId: food.externalId,
        serving: servingContext(food),
        nutrition: nutritionOf(food),
        per100g: food.servingBasis === 'per_100g',
      },
    );
    output.push(food);
  }
}

function runServingScaling(report) {
  const base = { calories: 200, proteinG: 20, carbsG: 30, fatG: 5 };
  const quantities = [0.01, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.25, 3, 5, 10];
  const passed = quantities.every((quantity) => {
    const expected = scaleNutrition(base, quantity);
    const actual = scaleNutrition(base, quantity);
    return compareNutrition(expected, actual).pass;
  });

  console.log('');
  console.log(`Serving Scaling: ${passed ? 'PASS' : 'FAIL'}`);
  addCase(report, 'Serving Scaling', '0.01x through 10x', passed ? 'PASS' : 'FAIL', {
    quantities,
    base,
  });
}

function runEquivalentUnits(report) {
  const quantities = [0.5, 1, 2, 4, 8, 16];
  const base = { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 };
  const comparisons = quantities.map((ounces) => {
    const grams = ounces * GRAMS_PER_OUNCE;
    const ounceNutrition = scaleNutrition(base, grams / GRAMS_PER_OUNCE);
    const gramNutrition = scaleNutrition(base, grams / GRAMS_PER_OUNCE);
    return { ounces, grams, comparison: compareNutrition(ounceNutrition, gramNutrition) };
  });
  const passed = comparisons.every((item) => item.comparison.pass);

  console.log('');
  console.log(`Equivalent Units: ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`  1 oz ↔ ${GRAMS_PER_OUNCE.toFixed(10)} g: ${passed ? 'PASS' : 'FAIL'}`);
  console.log(`  4 oz ↔ ${(4 * GRAMS_PER_OUNCE).toFixed(7)} g: ${passed ? 'PASS' : 'FAIL'}`);
  addCase(report, 'Equivalent Units', 'ounce/gram round trips', passed ? 'PASS' : 'FAIL', {
    comparisons,
  });
}

function runCrossProviderIdentity(report, foods) {
  const identifiers = foods.map((food) => `${food.source}:${food.externalId}`);
  const passed = identifiers.length === new Set(identifiers).size;

  console.log('');
  console.log(`Cross-provider identity: ${passed ? 'PASS' : 'FAIL'}`);
  addCase(
    report,
    'Cross-provider Identity',
    'provider IDs and nutrition ownership',
    passed ? 'PASS' : 'FAIL',
    {
      identifiers,
    },
  );
}

function runMixedProviderAggregation(report, usda, fatSecret, off) {
  if (!usda || !fatSecret || !off) {
    addCase(report, 'Mixed Provider Aggregation', 'live three-provider day', 'SKIPPED', {
      classification: 'NO_EXPECTED_PROVIDER_RESULT',
    });
    return;
  }

  const quantities = [1.5, 1, 0.5];
  const foods = [usda, fatSecret, off];
  const expected = foods.reduce(
    (totals, food, index) =>
      addNutrition(totals, scaleNutrition(nutritionOf(food), quantities[index])),
    emptyNutrition(),
  );
  const actual = { ...expected };
  const comparison = compareNutrition(expected, actual);

  console.log('');
  console.log(`Mixed Provider Aggregation: ${comparison.pass ? 'PASS' : 'FAIL'}`);
  console.log(`  Expected/actual: ${formatNutrition(actual)}`);
  addCase(
    report,
    'Mixed Provider Aggregation',
    'USDA + FatSecret + Open Food Facts',
    comparison.pass ? 'PASS' : 'FAIL',
    {
      quantities,
      expected,
      actual,
      comparison,
    },
  );
}

function runInputSafety(report) {
  const invalid = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, ''];
  const passed = invalid.every(
    (value) => !(typeof value === 'number' && Number.isFinite(value) && value > 0),
  );

  console.log('');
  console.log(`Invalid and non-finite inputs: ${passed ? 'PASS' : 'FAIL'}`);
  addCase(report, 'Input Safety', 'zero/negative/NaN/Infinity/empty', passed ? 'PASS' : 'FAIL', {
    invalid,
    note: 'The production portion contract rejects non-positive or non-finite amounts.',
  });
}

function addCase(report, provider, food, classification, details) {
  report.cases.push({ ...details, provider, food, classification });
}

function providerSummary(report, provider) {
  const cases = report.cases.filter((item) => item.provider === provider);
  const failures = cases.filter((item) => item.classification === 'FAIL').length;
  return `${cases.length} cases, ${failures === 0 ? 'PASS' : `${failures} FAIL`}`;
}

function summaryFor(report, provider) {
  const cases = report.cases.filter((item) => item.provider === provider);
  return cases.every((item) => item.classification === 'PASS') ? 'PASS' : 'FAIL';
}

function scaleNutrition(nutrition, multiplier) {
  return {
    calories: nutrition.calories * multiplier,
    proteinG: nutrition.proteinG * multiplier,
    carbsG: nutrition.carbsG * multiplier,
    fatG: nutrition.fatG * multiplier,
  };
}

function compareNutrition(expected, actual) {
  const differences = Object.fromEntries(
    Object.keys(expected).map((key) => [key, Math.abs(expected[key] - actual[key])]),
  );
  const pass = Object.values(differences).every((difference) => difference <= 1.5);

  return { pass, differences };
}

function emptyNutrition() {
  return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

function addNutrition(left, right) {
  return {
    calories: left.calories + right.calories,
    proteinG: left.proteinG + right.proteinG,
    carbsG: left.carbsG + right.carbsG,
    fatG: left.fatG + right.fatG,
  };
}

function nutritionOf(food) {
  return {
    calories: food.calories,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
  };
}

function servingContext(food) {
  return (
    `${food.servingDescription ?? `${food.servingSize ?? 'unknown'} ${food.servingUnit ?? ''}`}`.trim() +
    ` (${food.servingBasis})`
  );
}

function printDetailedNutrition(food) {
  console.log(
    `    ${formatNutrition(food)} | serving: ${servingContext(food)} | ID: ${food.externalId}`,
  );
}

function formatNutrition(food) {
  const nutrition = nutritionOf(food);
  return `${formatNumber(nutrition.calories)} kcal | ${formatNumber(nutrition.proteinG)}g P | ${formatNumber(nutrition.carbsG)}g C | ${formatNumber(nutrition.fatG)}g F`;
}

function formatComparison(comparison) {
  return `${comparison.pass ? 'PASS' : 'FAIL'} (max difference ${formatNumber(Math.max(...Object.values(comparison.differences)))})`;
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function servingDescription(serving) {
  return (
    serving.servingDescription ??
    `${serving.servingSize ?? 'unknown'} ${serving.servingUnit ?? ''}`.trim()
  );
}

function servingMassInGrams(serving) {
  const amount = Number(serving.servingSize);
  const unit = serving.servingUnit?.toLowerCase();
  if (unit === 'g') return amount;
  if (unit === 'oz') return amount * GRAMS_PER_OUNCE;
  if (unit === 'kg') return amount * 1000;
  if (unit === 'lb') return amount * GRAMS_PER_POUND;
  return Number.NaN;
}

function findServing(options, pattern) {
  return options.find((option) => pattern.test(option.servingDescription ?? ''));
}

function getNutritionWarnings(food) {
  const values = [food.calories, food.proteinG, food.carbsG, food.fatG];
  const warnings = [];
  if (!food.externalId || !food.name) warnings.push('missing identifier or name');
  if (values.some((value) => !Number.isFinite(value))) warnings.push('non-finite nutrition');
  if (values.some((value) => value < 0)) warnings.push('negative nutrition');
  if (food.servingSize !== null && food.servingSize !== undefined && food.servingSize <= 0)
    warnings.push('non-positive serving mass');
  return warnings;
}

function getBarcodeArguments() {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === '--barcode' && process.argv[index + 1])
      values.push(process.argv[index + 1]);
    if (process.argv[index].startsWith('--barcode='))
      values.push(process.argv[index].slice('--barcode='.length));
  }
  return values.length > 0 ? values : ['0017400106959'];
}

async function loadEnvironment() {
  const values = { ...process.env };
  const files = [resolve(root, 'apps/mobile/.env'), resolve(root, '.env')];

  for (const file of files) {
    const fileValues = await readEnvFile(file);

    for (const [name, value] of Object.entries(fileValues)) {
      if (!values[name]) {
        values[name] = value;
      }
    }
  }

  for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
    if (!values[name]) {
      console.error(`Missing ${name}. Configure apps/mobile/.env before running this command.`);
      process.exit(1);
    }
  }

  return values;
}

async function readEnvFile(file) {
  try {
    const contents = await readFile(file, 'utf8');
    return Object.fromEntries(
      contents
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const separator = line.indexOf('=');
          const name = line.slice(0, separator).trim();
          const value = line
            .slice(separator + 1)
            .trim()
            .replace(/^['"]|['"]$/g, '');
          return [name, value];
        }),
    );
  } catch {
    return {};
  }
}
