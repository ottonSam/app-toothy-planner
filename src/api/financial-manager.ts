import { z } from 'zod';

import { apiRequest } from '@/api/client';
import {
  expenseCategoryResponseSchema,
  expenseAudioResponseSchema,
  expenseCycleMetricsResponseSchema,
  expenseCycleResponseSchema,
  expenseResponseSchema,
  expenseTextResponseSchema,
  expenseWalletMetricsResponseSchema,
  expenseWalletResponseSchema,
  installmentExpenseResponseSchema,
  recurringExpenseResponseSchema,
} from '@/schemas/api';
import type {
  ExpenseCategoryResponse,
  ExpenseAudioResponse,
  ExpenseCycleMetricsResponse,
  ExpenseCycleResponse,
  ExpenseResponse,
  ExpenseTextResponse,
  ExpenseWalletMetricsResponse,
  ExpenseWalletResponse,
  InstallmentExpenseResponse,
  RecurringExpenseResponse,
} from '@/types/api';

const walletListSchema = z.array(expenseWalletResponseSchema);
const categoryListSchema = z.array(expenseCategoryResponseSchema);
const cycleListSchema = z.array(expenseCycleResponseSchema);
const expenseListSchema = z.array(expenseResponseSchema);

const financialBase = '/financial-manager';

export type ExpenseWalletRequest = {
  description: string;
  spendingGoal: number;
  startsAt: string;
  targetSpendingDay: number;
};

export type OneTimeExpenseRequest = {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
};

export type InstallmentExpenseRequest = {
  category: string;
  description: string;
  totalAmount?: number;
  installmentAmount?: number;
  installments: number;
  firstExpenseDate: string;
};

export type RecurringExpenseRequest = {
  category: string;
  description: string;
  amount: number;
  startsAt: string;
};

export type TextExpenseRequest = {
  text: string;
  referenceDate?: string;
};

export type AudioExpenseRequest = {
  audioBase64: string;
  contentType: string;
  referenceDate?: string;
};

export function listExpenseWallets() {
  return apiRequest<ExpenseWalletResponse[]>(`${financialBase}/wallets`, {
    schema: walletListSchema,
  });
}

export function createExpenseWallet(body: ExpenseWalletRequest) {
  return apiRequest<ExpenseWalletResponse, ExpenseWalletRequest>(`${financialBase}/wallets`, {
    method: 'POST',
    body,
    schema: expenseWalletResponseSchema,
  });
}

export function updateExpenseWallet(walletId: string, body: ExpenseWalletRequest) {
  return apiRequest<ExpenseWalletResponse, ExpenseWalletRequest>(
    `${financialBase}/wallets/${walletId}`,
    {
      method: 'PUT',
      body,
      schema: expenseWalletResponseSchema,
    }
  );
}

export function getExpenseWalletMetrics(walletId: string) {
  return apiRequest<ExpenseWalletMetricsResponse>(`${financialBase}/wallets/${walletId}/metrics`, {
    schema: expenseWalletMetricsResponseSchema,
  });
}

export function listExpenseCycles(walletId: string) {
  return apiRequest<ExpenseCycleResponse[]>(`${financialBase}/wallets/${walletId}/cycles`, {
    schema: cycleListSchema,
  });
}

export function getExpenseCycleMetrics(walletId: string, cycleId: string) {
  return apiRequest<ExpenseCycleMetricsResponse>(
    `${financialBase}/wallets/${walletId}/cycles/${cycleId}/metrics`,
    {
      schema: expenseCycleMetricsResponseSchema,
    }
  );
}

export function listCycleExpenses(walletId: string, cycleId: string) {
  return apiRequest<ExpenseResponse[]>(
    `${financialBase}/wallets/${walletId}/cycles/${cycleId}/expenses`,
    {
      schema: expenseListSchema,
    }
  );
}

export function listExpenseCategories() {
  return apiRequest<ExpenseCategoryResponse[]>(`${financialBase}/categories`, {
    schema: categoryListSchema,
  });
}

export function createOneTimeExpense(walletId: string, body: OneTimeExpenseRequest) {
  return apiRequest<ExpenseResponse, OneTimeExpenseRequest>(
    `${financialBase}/wallets/${walletId}/expenses`,
    {
      method: 'POST',
      body,
      schema: expenseResponseSchema,
    }
  );
}

export function createExpenseFromText(walletId: string, body: TextExpenseRequest) {
  return apiRequest<ExpenseTextResponse, TextExpenseRequest>(
    `${financialBase}/wallets/${walletId}/expenses/text`,
    {
      method: 'POST',
      body,
      schema: expenseTextResponseSchema,
    }
  );
}

export function createExpenseFromAudio(walletId: string, body: AudioExpenseRequest) {
  return apiRequest<ExpenseAudioResponse, AudioExpenseRequest>(
    `${financialBase}/wallets/${walletId}/expenses/audio`,
    {
      method: 'POST',
      body,
      schema: expenseAudioResponseSchema,
    }
  );
}

export function createInstallmentExpense(walletId: string, body: InstallmentExpenseRequest) {
  return apiRequest<InstallmentExpenseResponse, InstallmentExpenseRequest>(
    `${financialBase}/wallets/${walletId}/installment-expenses`,
    {
      method: 'POST',
      body,
      schema: installmentExpenseResponseSchema,
    }
  );
}

export function createRecurringExpense(walletId: string, body: RecurringExpenseRequest) {
  return apiRequest<RecurringExpenseResponse, RecurringExpenseRequest>(
    `${financialBase}/wallets/${walletId}/recurring-expenses`,
    {
      method: 'POST',
      body,
      schema: recurringExpenseResponseSchema,
    }
  );
}

export function deleteExpense(walletId: string, expenseId: string) {
  return apiRequest<void>(`${financialBase}/wallets/${walletId}/expenses/${expenseId}`, {
    method: 'DELETE',
  });
}
