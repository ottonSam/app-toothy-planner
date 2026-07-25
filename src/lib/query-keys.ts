export const queryKeys = {
  user: ['user'] as const,
  goals: ['user', 'goals'] as const,
  goalTypes: ['user', 'goals', 'types'] as const,
  expenseWallets: ['user', 'financial-manager', 'wallets'] as const,
  expenseWalletMetrics: (walletId: string) =>
    ['user', 'financial-manager', 'wallets', walletId, 'metrics'] as const,
  expenseCategories: ['user', 'financial-manager', 'categories'] as const,
  expenseCycles: (walletId: string) =>
    ['user', 'financial-manager', 'wallets', walletId, 'cycles'] as const,
  expenseCycleMetrics: (walletId: string, cycleId: string) =>
    ['user', 'financial-manager', 'wallets', walletId, 'cycles', cycleId, 'metrics'] as const,
  cycleExpenses: (walletId: string, cycleId: string) =>
    ['user', 'financial-manager', 'wallets', walletId, 'cycles', cycleId, 'expenses'] as const,
  calendars: ['user', 'calendars'] as const,
  calendarReports: (calendarId: string) => ['user', 'calendars', calendarId, 'reports'] as const,
  weekActivities: (calendarId: string, week: number) =>
    ['user', 'calendars', calendarId, 'weeks', week, 'activities'] as const,
};
