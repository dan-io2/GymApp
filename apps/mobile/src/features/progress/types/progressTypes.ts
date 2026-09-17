export type UnitSystem = 'metric' | 'imperial';

export type WeightCheckIn = {
  id: string;
  userId: string;
  weightKg: number;
  localDate: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type WeightTrendRange = '1m' | '3m' | '6m' | '1y' | 'all';

export type WeightTrendPoint = {
  date: string;
  weightKg: number;
  displayWeight: number;
  displayUnit: 'kg' | 'lb';
};

export type DiaryDaySummary = {
  date: string;
  entryCount: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type CalendarDayState = {
  date: string;
  state: 'future' | 'untracked' | 'tracked';
  tracked: boolean;
  entryCount: number;
  calories: number | null;
};

export type ConsistencySummary = {
  currentStreak: number;
  longestStreak: number;
  monthlyConsistencyPercentage: number;
  monthlyEligibleDays: number;
  monthlyTrackedDays: number;
  totalTrackedDays: number;
};

export type MonthlyRecap = {
  month: string;
  trackedDays: number;
  eligibleDays: number;
  consistencyPercentage: number;
  longestStreak: number;
  totalFoodsLogged: number;
  averageCalories: number | null;
  averageProteinG: number | null;
  averageCarbsG: number | null;
  averageFatG: number | null;
  calorieTargetDays: number | null;
  proteinTargetDays: number | null;
  startingWeightKg: number | null;
  endingWeightKg: number | null;
  weightChangeKg: number | null;
};

export type ProgressSnapshot = {
  unitSystem: UnitSystem;
  checkIns: WeightCheckIn[];
  calendarMonth: CalendarDayState[];
  calendarYear: CalendarDayState[];
  latestCheckIn: WeightCheckIn | null;
  previousCheckIn: WeightCheckIn | null;
  changeKg: number | null;
  checkedInThisWeek: boolean;
  daysSinceLastCheckIn: number | null;
  consistency: ConsistencySummary;
  recap: MonthlyRecap;
};
