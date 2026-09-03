import type { ActivityLevel, GoalType, SexForCalculation } from '@gymapp/nutrition';

export const ONBOARDING_STEPS = [
  'welcome',
  'units',
  'dateOfBirth',
  'sex',
  'height',
  'weight',
  'activity',
  'goal',
  'target',
  'review',
] as const;

export const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  title: string;
  description: string;
}[] = [
  {
    value: 'sedentary',
    title: 'Sedentary',
    description: 'Little or no structured exercise',
  },
  {
    value: 'lightly_active',
    title: 'Lightly active',
    description: 'Exercise 1-3 days/week',
  },
  {
    value: 'moderately_active',
    title: 'Moderately active',
    description: 'Exercise 3-5 days/week',
  },
  {
    value: 'very_active',
    title: 'Very active',
    description: 'Hard exercise 6-7 days/week',
  },
  {
    value: 'extremely_active',
    title: 'Extremely active',
    description: 'Very hard training / highly physical lifestyle',
  },
];

export const GOAL_OPTIONS: {
  value: GoalType;
  title: string;
  description: string;
}[] = [
  {
    value: 'lose',
    title: 'Lose weight',
    description: 'Use a sustainable calorie deficit',
  },
  {
    value: 'maintain',
    title: 'Maintain weight',
    description: 'Estimate your maintenance calories',
  },
  {
    value: 'gain',
    title: 'Gain weight / muscle',
    description: 'Use a controlled calorie surplus',
  },
];

export const SEX_OPTIONS: {
  value: SexForCalculation;
  title: string;
}[] = [
  {
    value: 'male',
    title: 'Male',
  },
  {
    value: 'female',
    title: 'Female',
  },
];
