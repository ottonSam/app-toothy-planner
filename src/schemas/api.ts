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

export const expenseCategoryResponseSchema = z.object({
  key: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  description: z.string(),
});

export const expenseCategorySummaryResponseSchema = z.object({
  key: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
});

export const expenseWalletResponseSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  spendingGoal: z.number(),
  startsAt: z.string(),
  targetSpendingDay: z.number(),
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
  targetSpendingDate: z.string(),
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
  source: z.enum(['MANUAL', 'AI_TEXT', 'AI_AUDIO']),
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
  remainingDailyAmount: z.number().nullable(),
  spentUntilTargetDate: z.number(),
  spentAfterTargetDate: z.number().nullable(),
  installmentTotalFromCurrentCycle: z.number(),
  recurringMonthlyTotal: z.number(),
  oneTimeTotal: z.number(),
  spendingByCategory: z.array(
    z.object({
      category: expenseCategorySummaryResponseSchema,
      totalSpent: z.number(),
      percentage: z.number(),
    })
  ),
});

export const expenseWalletMetricsResponseSchema = z.object({
  walletId: z.string().uuid(),
  description: z.string(),
  spendingGoal: z.number(),
  startsAt: z.string(),
  targetSpendingDay: z.number(),
  currentCycle: expenseCycleResponseSchema.nullable(),
  currentCycleMetrics: expenseCycleMetricsResponseSchema.nullable(),
  activeRecurringMonthlyTotal: z.number(),
  installmentTotalFromCurrentCycle: z.number(),
});

export const expenseTextResponseSchema = z.object({
  type: z.enum(['ONE_TIME', 'INSTALLMENT', 'RECURRING']),
  expense: expenseResponseSchema.nullable(),
  installmentExpense: installmentExpenseResponseSchema.nullable(),
  recurringExpense: recurringExpenseResponseSchema.nullable(),
  generatedExpenses: z.array(expenseResponseSchema),
});

export const expenseAudioResponseSchema = z.object({
  transcribedText: z.string(),
  classification: z.object({
    type: z.enum(['ONE_TIME', 'INSTALLMENT', 'RECURRING']),
  }),
  expense: expenseResponseSchema.nullable(),
  installmentExpense: installmentExpenseResponseSchema.nullable(),
  recurringExpense: recurringExpenseResponseSchema.nullable(),
  generatedExpenses: z.array(expenseResponseSchema),
});

export const flashcardDeckTypeSchema = z.enum(['VOCABULARY', 'IRREGULAR_VERBS', 'EXPRESSIONS']);

export const flashcardGenerationStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELED',
  'PARTIAL_COMPLETED',
]);

export const flashcardReviewRatingSchema = z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']);

export const flashcardDeckResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  context: z.string(),
  targetLanguage: z.string(),
  baseLanguage: z.string(),
  type: flashcardDeckTypeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const flashcardExampleResponseSchema = z.object({
  text: z.string(),
  translation: z.string(),
});

export const flashcardTagResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const flashcardCardResponseSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  type: flashcardDeckTypeSchema,
  word: z.string().nullable(),
  baseVerb: z.string().nullable(),
  pastSimple: z.string().nullable(),
  pastParticiple: z.string().nullable(),
  expression: z.string().nullable(),
  translation: z.string(),
  phonetic: z.string().nullable(),
  level: z.string().nullable(),
  usageNote: z.string().nullable(),
  active: z.boolean(),
  lastSeenAt: z.string().nullable(),
  lastReviewedAt: z.string().nullable(),
  nextReviewAt: z.string().nullable(),
  reviewCount: z.number(),
  correctCount: z.number(),
  wrongCount: z.number(),
  consecutiveCorrect: z.number(),
  consecutiveWrong: z.number(),
  difficulty: z.number(),
  examples: z.array(flashcardExampleResponseSchema),
  tags: z.array(flashcardTagResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const flashcardCardPageResponseSchema = z.object({
  content: z.array(flashcardCardResponseSchema),
  page: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  first: z.boolean(),
  last: z.boolean(),
});

export const flashcardGenerationBatchResponseSchema = z.object({
  id: z.string().uuid(),
  batchNumber: z.number(),
  requestedCount: z.number(),
  createdCount: z.number(),
  status: flashcardGenerationStatusSchema,
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const flashcardGenerationJobResponseSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  type: flashcardDeckTypeSchema,
  context: z.string(),
  targetLanguage: z.string(),
  baseLanguage: z.string(),
  requestedCount: z.number(),
  createdCount: z.number(),
  status: flashcardGenerationStatusSchema,
  errorMessage: z.string().nullable(),
  batches: z.array(flashcardGenerationBatchResponseSchema),
  createdAt: z.string(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const flashcardNextCardResponseSchema = z.object({
  card: flashcardCardResponseSchema,
  score: z.number(),
});

export const flashcardReviewRatingResponseSchema = z.object({
  key: flashcardReviewRatingSchema,
  name: z.string(),
  description: z.string(),
});

export const flashcardMetricsResponseSchema = z.object({
  totalDecks: z.number(),
  activeCards: z.number(),
  reviewedToday: z.number(),
  reviewedThisWeek: z.number(),
  totalCorrect: z.number(),
  totalWrong: z.number(),
  accuracyRate: z.number(),
  dueCards: z.number(),
  neverSeenCards: z.number(),
});
