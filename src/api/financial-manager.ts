import { z } from 'zod';

import { apiRequest } from '@/api/client';
import {
  expenseCategoryResponseSchema,
  expenseCycleMetricsResponseSchema,
  expenseCycleResponseSchema,
  expenseResponseSchema,
  expenseWalletMetricsResponseSchema,
  expenseWalletResponseSchema,
  installmentExpenseResponseSchema,
  recurringExpenseResponseSchema,
} from '@/schemas/api';
import type {
  ExpenseCategoryResponse,
  ExpenseCycleMetricsResponse,
  ExpenseCycleResponse,
  ExpenseResponse,
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
  cycleEndDay: number;
};

export type ExpenseCategoryRequest = {
  name: string;
  color: string;
  icon: string;
};

export type OneTimeExpenseRequest = {
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
};

export type InstallmentExpenseRequest = {
  categoryId: string;
  description: string;
  totalAmount?: number;
  installmentAmount?: number;
  installments: number;
  firstExpenseDate: string;
};

export type RecurringExpenseRequest = {
  categoryId: string;
  description: string;
  amount: number;
  startsAt: string;
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

export function createExpenseCategory(body: ExpenseCategoryRequest) {
  return apiRequest<ExpenseCategoryResponse, ExpenseCategoryRequest>(
    `${financialBase}/categories`,
    {
      method: 'POST',
      body,
      schema: expenseCategoryResponseSchema,
    }
  );
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
