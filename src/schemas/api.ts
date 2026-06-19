import { z } from 'zod';

export const messageResponseSchema = z.object({
  message: z.string(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  profileImage: z.string().nullable(),
  theme: z.enum(['DARK', 'LIGHT']),
  isActive: z.boolean(),
});

export const optionResponseSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const goalResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['LONG_TERM', 'MEDIUM_TERM', 'CALENDAR']),
  isComplete: z.boolean(),
});

export const calendarResponseSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  weeks: z.number(),
  starts: z.string(),
  weekStartsOn: z.enum([
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ]),
  weekEndsOn: z.enum([
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ]),
  goalIds: z.array(z.string().uuid()),
});

export const activityResponseSchema = z.object({
  id: z.string().uuid(),
  calendarId: z.string().uuid(),
  description: z.string(),
  week: z.number(),
  type: z.enum(['DAYS', 'COUNT', 'TIME']),
  goal: z.number(),
  weekStartsAt: z.string(),
  weekEndsAt: z.string(),
  progress: z.number(),
  progressDays: z.array(
    z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])
  ),
});

export const weeklyPerformanceReportResponseSchema = z.object({
  id: z.string().uuid(),
  calendarId: z.string().uuid(),
  week: z.number(),
  weekStartsAt: z.string(),
  weekEndsAt: z.string(),
  userFeedback: z.string(),
  metrics: z.record(z.string(), z.unknown()),
  markdownReport: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const dietGoalResponseSchema = z.object({
  kcal: z.number(),
  protein: z.number(),
  carbohydrate: z.number(),
  fat: z.number(),
});

export const foodResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kcalPerGram: z.number(),
  proteinPerGram: z.number(),
  carbohydratePerGram: z.number(),
  fatPerGram: z.number(),
  kcalPerPortion: z.number(),
  proteinPerPortion: z.number(),
  carbohydratePerPortion: z.number(),
  fatPerPortion: z.number(),
  portionDescription: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const foodSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  portionDescription: z.string(),
});

export const dietEntryResponseSchema = z.object({
  id: z.string().uuid(),
  food: foodSummaryResponseSchema,
  entryDate: z.string(),
  quantity: z.number(),
  unit: z.enum(['GRAMS', 'PORTIONS']),
  kcal: z.number(),
  protein: z.number(),
  carbohydrate: z.number(),
  fat: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const dietMetricsResponseSchema = z.object({
  date: z.string(),
  goal: dietGoalResponseSchema,
  consumed: dietGoalResponseSchema,
  remaining: dietGoalResponseSchema,
  entries: z.array(dietEntryResponseSchema),
});

export const expenseCategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseCategorySummaryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
});

export const expenseWalletResponseSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  spendingGoal: z.number(),
  cycleEndDay: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseCycleResponseSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  referenceMonth: z.number(),
  referenceYear: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseResponseSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  cycleId: z.string().uuid(),
  category: expenseCategorySummaryResponseSchema,
  description: z.string(),
  amount: z.number(),
  expenseDate: z.string(),
  type: z.enum(['ONE_TIME', 'INSTALLMENT', 'RECURRING']),
  parentExpenseId: z.string().uuid().nullable(),
  installmentNumber: z.number().nullable(),
  installmentTotal: z.number().nullable(),
  recurrenceId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const installmentExpenseResponseSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  category: expenseCategorySummaryResponseSchema,
  description: z.string(),
  totalAmount: z.number().nullable(),
  installmentAmount: z.number().nullable(),
  installments: z.number(),
  firstExpenseDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const recurringExpenseResponseSchema = z.object({
  id: z.string().uuid(),
  walletId: z.string().uuid(),
  category: expenseCategorySummaryResponseSchema,
  description: z.string(),
  amount: z.number(),
  startsAt: z.string(),
  canceledAt: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseCycleMetricsResponseSchema = z.object({
  walletId: z.string().uuid(),
  cycleId: z.string().uuid(),
  referenceMonth: z.number(),
  referenceYear: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  spendingGoal: z.number(),
  totalSpent: z.number(),
  remainingAmount: z.number(),
  remainingDailyAmount: z.number(),
  installmentTotalFromCurrentCycle: z.number(),
  recurringMonthlyTotal: z.number(),
  oneTimeTotal: z.number(),
});

export const expenseWalletMetricsResponseSchema = z.object({
  walletId: z.string().uuid(),
  description: z.string(),
  spendingGoal: z.number(),
  cycleEndDay: z.number(),
  currentCycle: expenseCycleResponseSchema.nullable(),
  currentCycleMetrics: expenseCycleMetricsResponseSchema.nullable(),
  activeRecurringMonthlyTotal: z.number(),
  installmentTotalFromCurrentCycle: z.number(),
});
