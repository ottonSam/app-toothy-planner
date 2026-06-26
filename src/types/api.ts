export type UserTheme = 'DARK' | 'LIGHT';

export type GoalType = 'LONG_TERM' | 'MEDIUM_TERM' | 'CALENDAR';

export type ActivityType = 'DAYS' | 'COUNT' | 'TIME';

export type DietEntryUnit = 'GRAMS' | 'PORTIONS';

export type ExpenseType = 'ONE_TIME' | 'INSTALLMENT' | 'RECURRING';

export type WeekDay =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export type MessageResponse = {
  message: string;
};

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  theme: UserTheme;
  isActive: boolean;
};

export type OptionResponse<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type GoalResponse = {
  id: string;
  name: string;
  type: GoalType;
  isComplete: boolean;
};

export type CalendarResponse = {
  id: string;
  description: string;
  weeks: number;
  starts: string;
  weekStartsOn: WeekDay;
  weekEndsOn: WeekDay;
  goalIds: string[];
};

export type ActivityResponse = {
  id: string;
  calendarId: string;
  description: string;
  week: number;
  type: ActivityType;
  goal: number;
  weekStartsAt: string;
  weekEndsAt: string;
  progress: number;
  progressDays: WeekDay[];
};

export type WeeklyPerformanceReportResponse = {
  id: string;
  calendarId: string;
  week: number;
  weekStartsAt: string;
  weekEndsAt: string;
  userFeedback: string;
  metrics: Record<string, unknown>;
  markdownReport: string;
  createdAt: string;
  updatedAt: string;
};

export type DietGoalResponse = {
  kcal: number;
  protein: number;
  carbohydrate: number;
  fat: number;
};

export type FoodResponse = {
  id: string;
  name: string;
  kcalPerGram: number;
  proteinPerGram: number;
  carbohydratePerGram: number;
  fatPerGram: number;
  kcalPerPortion: number;
  proteinPerPortion: number;
  carbohydratePerPortion: number;
  fatPerPortion: number;
  portionDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type FoodSummaryResponse = {
  id: string;
  name: string;
  portionDescription: string;
};

export type DietEntryResponse = {
  id: string;
  food: FoodSummaryResponse;
  entryDate: string;
  quantity: number;
  unit: DietEntryUnit;
  kcal: number;
  protein: number;
  carbohydrate: number;
  fat: number;
  createdAt: string;
  updatedAt: string;
};

export type DietMetricsResponse = {
  date: string;
  goal: DietGoalResponse;
  consumed: DietGoalResponse;
  remaining: DietGoalResponse;
  entries: DietEntryResponse[];
};

export type ExpenseCategoryResponse = {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCategorySummaryResponse = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

export type ExpenseWalletResponse = {
  id: string;
  description: string;
  spendingGoal: number;
  cycleEndDay: number;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCycleResponse = {
  id: string;
  walletId: string;
  referenceMonth: number;
  referenceYear: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseResponse = {
  id: string;
  walletId: string;
  cycleId: string;
  category: ExpenseCategorySummaryResponse;
  description: string;
  amount: number;
  expenseDate: string;
  type: ExpenseType;
  parentExpenseId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InstallmentExpenseResponse = {
  id: string;
  walletId: string;
  category: ExpenseCategorySummaryResponse;
  description: string;
  totalAmount: number | null;
  installmentAmount: number | null;
  installments: number;
  firstExpenseDate: string;
  createdAt: string;
  updatedAt: string;
};

export type RecurringExpenseResponse = {
  id: string;
  walletId: string;
  category: ExpenseCategorySummaryResponse;
  description: string;
  amount: number;
  startsAt: string;
  canceledAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseCycleMetricsResponse = {
  walletId: string;
  cycleId: string;
  referenceMonth: number;
  referenceYear: number;
  startsAt: string;
  endsAt: string;
  spendingGoal: number;
  totalSpent: number;
  remainingAmount: number;
  remainingDailyAmount: number;
  installmentTotalFromCurrentCycle: number;
  recurringMonthlyTotal: number;
  oneTimeTotal: number;
  spendingByCategory: {
    category: ExpenseCategorySummaryResponse;
    totalSpent: number;
    percentage: number;
  }[];
};

export type ExpenseWalletMetricsResponse = {
  walletId: string;
  description: string;
  spendingGoal: number;
  cycleEndDay: number;
  currentCycle: ExpenseCycleResponse | null;
  currentCycleMetrics: ExpenseCycleMetricsResponse | null;
  activeRecurringMonthlyTotal: number;
  installmentTotalFromCurrentCycle: number;
};
