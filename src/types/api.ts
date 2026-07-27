export type UserTheme = 'DARK' | 'LIGHT';

export type GoalType = 'LONG_TERM' | 'MEDIUM_TERM' | 'CALENDAR';

export type ActivityType = 'DAYS' | 'COUNT' | 'TIME';

export type ExpenseType = 'ONE_TIME' | 'INSTALLMENT' | 'RECURRING';
export type ExpenseSource = 'MANUAL' | 'AI_TEXT' | 'AI_AUDIO';

export type FlashcardDeckType = 'VOCABULARY' | 'IRREGULAR_VERBS' | 'EXPRESSIONS';

export type FlashcardGenerationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
  | 'PARTIAL_COMPLETED';

export type FlashcardReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

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

export type ExpenseCategoryResponse = {
  key: string;
  name: string;
  color: string;
  icon: string;
  description: string;
};

export type ExpenseCategorySummaryResponse = {
  key: string;
  name: string;
  color: string;
  icon: string;
};

export type ExpenseWalletResponse = {
  id: string;
  description: string;
  spendingGoal: number;
  startsAt: string;
  targetSpendingDay: number;
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
  targetSpendingDate: string;
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
  source: ExpenseSource;
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
  remainingDailyAmount: number | null;
  spentUntilTargetDate: number;
  spentAfterTargetDate: number | null;
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
  startsAt: string;
  targetSpendingDay: number;
  currentCycle: ExpenseCycleResponse | null;
  currentCycleMetrics: ExpenseCycleMetricsResponse | null;
  activeRecurringMonthlyTotal: number;
  installmentTotalFromCurrentCycle: number;
};

export type ExpenseTextResponse = {
  type: ExpenseType;
  expense: ExpenseResponse | null;
  installmentExpense: InstallmentExpenseResponse | null;
  recurringExpense: RecurringExpenseResponse | null;
  generatedExpenses: ExpenseResponse[];
};

export type ExpenseAudioResponse = Omit<ExpenseTextResponse, 'type'> & {
  transcribedText: string;
  classification: {
    type: ExpenseType;
  };
};

export type FlashcardDeckResponse = {
  id: string;
  name: string;
  context: string;
  targetLanguage: string;
  baseLanguage: string;
  type: FlashcardDeckType;
  createdAt: string;
  updatedAt: string;
};

export type FlashcardExampleResponse = {
  text: string;
  translation: string;
};

export type FlashcardTagResponse = {
  id: string;
  name: string;
};

export type FlashcardCardResponse = {
  id: string;
  deckId: string;
  type: FlashcardDeckType;
  word: string | null;
  baseVerb: string | null;
  pastSimple: string | null;
  pastParticiple: string | null;
  expression: string | null;
  translation: string;
  phonetic: string | null;
  level: string | null;
  usageNote: string | null;
  active: boolean;
  lastSeenAt: string | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  difficulty: number;
  examples: FlashcardExampleResponse[];
  tags: FlashcardTagResponse[];
  createdAt: string;
  updatedAt: string;
};

export type FlashcardCardPageResponse = {
  content: FlashcardCardResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type FlashcardGenerationBatchResponse = {
  id: string;
  batchNumber: number;
  requestedCount: number;
  createdCount: number;
  status: FlashcardGenerationStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
};

export type FlashcardGenerationJobResponse = {
  id: string;
  deckId: string;
  type: FlashcardDeckType;
  context: string;
  targetLanguage: string;
  baseLanguage: string;
  requestedCount: number;
  createdCount: number;
  status: FlashcardGenerationStatus;
  errorMessage: string | null;
  batches: FlashcardGenerationBatchResponse[];
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
};

export type FlashcardNextCardResponse = {
  card: FlashcardCardResponse;
  score: number;
};

export type FlashcardReviewRatingResponse = {
  key: FlashcardReviewRating;
  name: string;
  description: string;
};

export type FlashcardMetricsResponse = {
  totalDecks: number;
  activeCards: number;
  reviewedToday: number;
  reviewedThisWeek: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number;
  dueCards: number;
  neverSeenCards: number;
};
