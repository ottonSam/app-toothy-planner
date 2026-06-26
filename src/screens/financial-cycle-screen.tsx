import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  createExpenseCategory,
  createInstallmentExpense,
  createOneTimeExpense,
  createRecurringExpense,
  deleteExpense,
  getExpenseCycleMetrics,
  getExpenseWalletMetrics,
  listCycleExpenses,
  listExpenseCategories,
  listExpenseCycles,
} from '@/api/financial-manager';
import { CardActionsMenu } from '@/components/card-actions-menu';
import { ControlledColorSwatches } from '@/components/forms/controlled-color-swatches';
import { ControlledDateInput } from '@/components/forms/controlled-date-input';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ControlledSelect } from '@/components/forms/controlled-select';
import { DeleteConfirmationDrawer } from '@/components/delete-confirmation-drawer';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { formatDateBr, toDateInputValue } from '@/lib/date-utils';
import { formatCurrencyBr, formatReferenceMonth } from '@/lib/financial-utils';
import { queryKeys } from '@/lib/query-keys';
import {
  expenseCategoryFormSchema,
  expenseFormSchema,
  type ExpenseCategoryFormData,
  type ExpenseFormData,
} from '@/schemas/forms';
import type {
  ExpenseCategoryResponse,
  ExpenseCycleMetricsResponse,
  ExpenseCycleResponse,
  ExpenseResponse,
  ExpenseType,
  ExpenseWalletResponse,
} from '@/types/api';

type FinancialCycleScreenProps = {
  onBack: () => void;
  wallet: ExpenseWalletResponse;
};

type CycleView = 'expenses' | 'metrics';

const categoryIconOptions = [
  { label: 'Alimentacao', value: 'restaurant-outline' },
  { label: 'Fast food', value: 'fast-food-outline' },
  { label: 'Cafe', value: 'cafe-outline' },
  { label: 'Mercado', value: 'basket-outline' },
  { label: 'Compras', value: 'cart-outline' },
  { label: 'Roupas', value: 'shirt-outline' },
  { label: 'Presentes', value: 'gift-outline' },
  { label: 'Transporte', value: 'car-outline' },
  { label: 'Combustivel', value: 'flame-outline' },
  { label: 'Onibus', value: 'bus-outline' },
  { label: 'Bicicleta', value: 'bicycle-outline' },
  { label: 'Viagem', value: 'airplane-outline' },
  { label: 'Moradia', value: 'home-outline' },
  { label: 'Construcao', value: 'construct-outline' },
  { label: 'Energia', value: 'flash-outline' },
  { label: 'Agua', value: 'water-outline' },
  { label: 'Servicos', value: 'wifi-outline' },
  { label: 'Celular', value: 'phone-portrait-outline' },
  { label: 'Cartao', value: 'card-outline' },
  { label: 'Carteira', value: 'wallet-outline' },
  { label: 'Dinheiro', value: 'cash-outline' },
  { label: 'Saude', value: 'medical-outline' },
  { label: 'Fitness', value: 'fitness-outline' },
  { label: 'Educacao', value: 'school-outline' },
  { label: 'Livros', value: 'book-outline' },
  { label: 'Lazer', value: 'game-controller-outline' },
  { label: 'Cinema', value: 'film-outline' },
  { label: 'Musica', value: 'musical-notes-outline' },
  { label: 'Pets', value: 'paw-outline' },
  { label: 'Trabalho', value: 'business-outline' },
  { label: 'Manutencao', value: 'hammer-outline' },
  { label: 'Outros', value: 'ellipsis-horizontal' },
];

export function FinancialCycleScreen({ onBack, wallet }: FinancialCycleScreenProps) {
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<CycleView>('expenses');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [expensePendingDeletion, setExpensePendingDeletion] = useState<ExpenseResponse | null>(
    null
  );

  const cyclesQuery = useQuery({
    queryKey: queryKeys.expenseCycles(wallet.id),
    queryFn: () => listExpenseCycles(wallet.id),
  });
  const walletMetricsQuery = useQuery({
    queryKey: queryKeys.expenseWalletMetrics(wallet.id),
    queryFn: () => getExpenseWalletMetrics(wallet.id),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.expenseCategories,
    queryFn: listExpenseCategories,
  });

  const selectedCycle = cyclesQuery.data?.find((cycle) => cycle.id === selectedCycleId) ?? null;
  const selectedCycleIndex = selectedCycle
    ? (cyclesQuery.data?.findIndex((cycle) => cycle.id === selectedCycle.id) ?? -1)
    : -1;

  const cycleMetricsQuery = useQuery({
    enabled: Boolean(selectedCycleId),
    queryKey: queryKeys.expenseCycleMetrics(wallet.id, selectedCycleId ?? ''),
    queryFn: () => getExpenseCycleMetrics(wallet.id, selectedCycleId ?? ''),
  });
  const expensesQuery = useQuery({
    enabled: Boolean(selectedCycleId),
    queryKey: queryKeys.cycleExpenses(wallet.id, selectedCycleId ?? ''),
    queryFn: () => listCycleExpenses(wallet.id, selectedCycleId ?? ''),
  });

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: '',
      amountMode: 'TOTAL',
      categoryId: '',
      date: toDateInputValue(new Date()),
      description: '',
      installments: '',
      type: 'ONE_TIME',
    },
  });
  const categoryForm = useForm<ExpenseCategoryFormData>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: {
      color: '#F97316',
      icon: 'restaurant-outline',
      name: '',
    },
  });

  useEffect(() => {
    const cycles = cyclesQuery.data;

    if (walletMetricsQuery.isLoading) {
      return;
    }

    if (!cycles?.length) {
      setSelectedCycleId(null);
      return;
    }

    if (selectedCycleId && cycles.some((cycle) => cycle.id === selectedCycleId)) {
      return;
    }

    const currentCycleId = walletMetricsQuery.data?.currentCycle?.id;
    const currentCycle = cycles.find((cycle) => cycle.id === currentCycleId);
    setSelectedCycleId(currentCycle?.id ?? cycles[cycles.length - 1].id);
  }, [
    cyclesQuery.data,
    selectedCycleId,
    walletMetricsQuery.data?.currentCycle?.id,
    walletMetricsQuery.isLoading,
  ]);

  const invalidateFinancialData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseWallets }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseWalletMetrics(wallet.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseCycles(wallet.id) }),
    ]);

    if (selectedCycleId) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.expenseCycleMetrics(wallet.id, selectedCycleId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.cycleExpenses(wallet.id, selectedCycleId),
        }),
      ]);
    }
  };

  const categoryMutation = useMutation({
    mutationFn: createExpenseCategory,
    onError: feedback.showError,
    onSuccess: async (category) => {
      queryClient.setQueryData<ExpenseCategoryResponse[]>(
        queryKeys.expenseCategories,
        (categories) => [...(categories ?? []), category]
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
      categoryForm.reset({
        color: '#F97316',
        icon: 'restaurant-outline',
        name: '',
      });
      setIsCategoryFormOpen(false);
      feedback.showSuccess('Categoria criada com sucesso.');
    },
  });

  const expenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const amount = parseDecimal(data.amount);

      if (data.type === 'INSTALLMENT') {
        await createInstallmentExpense(wallet.id, {
          categoryId: data.categoryId,
          description: data.description,
          firstExpenseDate: data.date,
          installments: Number(data.installments),
          ...(data.amountMode === 'TOTAL'
            ? { totalAmount: amount }
            : { installmentAmount: amount }),
        });
        return;
      }

      if (data.type === 'RECURRING') {
        await createRecurringExpense(wallet.id, {
          amount,
          categoryId: data.categoryId,
          description: data.description,
          startsAt: data.date,
        });
        return;
      }

      await createOneTimeExpense(wallet.id, {
        amount,
        categoryId: data.categoryId,
        description: data.description,
        expenseDate: data.date,
      });
    },
    onError: feedback.showError,
    onSuccess: async (_, data) => {
      await invalidateFinancialData();
      const cycles = await queryClient.fetchQuery({
        queryKey: queryKeys.expenseCycles(wallet.id),
        queryFn: () => listExpenseCycles(wallet.id),
      });
      const expenseCycle = cycles.find(
        (cycle) => data.date >= cycle.startsAt && data.date <= cycle.endsAt
      );

      if (expenseCycle) {
        setSelectedCycleId(expenseCycle.id);
      }

      expenseForm.reset({
        amount: '',
        amountMode: 'TOTAL',
        categoryId: categoriesQuery.data?.[0]?.id ?? '',
        date: toDateInputValue(new Date()),
        description: '',
        installments: '',
        type: 'ONE_TIME',
      });
      setIsExpenseFormOpen(false);
      feedback.showSuccess('Gasto cadastrado com sucesso.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(wallet.id, expenseId),
    onError: feedback.showError,
    onMutate: (expenseId) => setDeletingExpenseId(expenseId),
    onSettled: () => setDeletingExpenseId(null),
    onSuccess: async () => {
      await invalidateFinancialData();
      feedback.showSuccess('Gasto removido com sucesso.');
    },
  });

  const openExpenseForm = () => {
    setIsActionMenuOpen(false);

    if (!categoriesQuery.data?.length) {
      setIsCategoryFormOpen(true);
      feedback.showError(new Error('Cadastre uma categoria antes de adicionar um gasto.'));
      return;
    }

    expenseForm.reset({
      amount: '',
      amountMode: 'TOTAL',
      categoryId: categoriesQuery.data[0].id,
      date: toDateInputValue(new Date()),
      description: '',
      installments: '',
      type: 'ONE_TIME',
    });
    setIsExpenseFormOpen(true);
  };

  const openCategoryForm = () => {
    setIsActionMenuOpen(false);
    categoryForm.reset({
      color: '#F97316',
      icon: 'restaurant-outline',
      name: '',
    });
    setIsCategoryFormOpen(true);
  };

  const selectRelativeCycle = (offset: number) => {
    const cycles = cyclesQuery.data ?? [];
    const nextCycle = cycles[selectedCycleIndex + offset];

    if (nextCycle) {
      setSelectedCycleId(nextCycle.id);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityLabel="Voltar" accessibilityRole="button" onPress={onBack}>
            <Ionicons color={palette.foreground} name="chevron-back" size={28} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-semibold text-foreground">{wallet.description}</Text>
            <Text className="text-sm text-muted-foreground">
              Meta de {formatCurrencyBr(wallet.spendingGoal)} por ciclo
            </Text>
          </View>
        </View>

        <CycleSelector
          cycle={selectedCycle}
          disableNext={
            selectedCycleIndex < 0 || selectedCycleIndex === (cyclesQuery.data?.length ?? 0) - 1
          }
          disablePrevious={selectedCycleIndex <= 0}
          isLoading={cyclesQuery.isLoading || walletMetricsQuery.isLoading}
          onNext={() => selectRelativeCycle(1)}
          onPrevious={() => selectRelativeCycle(-1)}
        />

        <View className="flex-row rounded-md border border-border bg-muted p-1">
          <ViewModeButton
            active={selectedView === 'metrics'}
            label="Metricas"
            onPress={() => setSelectedView('metrics')}
          />
          <ViewModeButton
            active={selectedView === 'expenses'}
            label="Gastos"
            onPress={() => setSelectedView('expenses')}
          />
        </View>

        {selectedView === 'metrics' ? (
          <CycleMetrics
            cycle={selectedCycle}
            error={cycleMetricsQuery.error}
            isError={cycleMetricsQuery.isError}
            isLoading={cycleMetricsQuery.isLoading}
            metrics={cycleMetricsQuery.data}
            onRetry={() => cycleMetricsQuery.refetch()}
          />
        ) : (
          <CycleExpenseList
            cycle={selectedCycle}
            deletingExpenseId={deletingExpenseId}
            error={expensesQuery.error}
            expenses={expensesQuery.data}
            isError={expensesQuery.isError}
            isLoading={expensesQuery.isLoading}
            onDelete={(expenseId) =>
              setExpensePendingDeletion(
                expensesQuery.data?.find((expense) => expense.id === expenseId) ?? null
              )
            }
            onNewExpense={openExpenseForm}
            onRetry={() => expensesQuery.refetch()}
          />
        )}
      </ScreenScrollView>

      <FloatingFinancialActions
        isOpen={isActionMenuOpen}
        onCategory={openCategoryForm}
        onExpense={openExpenseForm}
        onToggle={() => setIsActionMenuOpen((current) => !current)}
      />

      <ExpenseFormDrawer
        categories={categoriesQuery.data ?? []}
        form={expenseForm}
        isOpen={isExpenseFormOpen}
        isPending={expenseMutation.isPending}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={(data) => expenseMutation.mutate(data)}
      />
      <CategoryFormDrawer
        form={categoryForm}
        isOpen={isCategoryFormOpen}
        isPending={categoryMutation.isPending}
        onClose={() => setIsCategoryFormOpen(false)}
        onSubmit={(data) => categoryMutation.mutate(data)}
      />
      <DeleteConfirmationDrawer
        description="O gasto sera removido do ciclo e das metricas financeiras. Esta acao nao pode ser desfeita."
        itemName={expensePendingDeletion?.description}
        onCancel={() => setExpensePendingDeletion(null)}
        onConfirm={() => {
          if (expensePendingDeletion) {
            deleteMutation.mutate(expensePendingDeletion.id);
          }
        }}
        title="Excluir gasto?"
        visible={Boolean(expensePendingDeletion)}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function CycleSelector({
  cycle,
  disableNext,
  disablePrevious,
  isLoading,
  onNext,
  onPrevious,
}: {
  cycle: ExpenseCycleResponse | null;
  disableNext: boolean;
  disablePrevious: boolean;
  isLoading: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  if (isLoading) {
    return <View className="h-28 rounded-2xl border border-border bg-muted" />;
  }

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Button size="sm" variant="secondary" disabled={disablePrevious} onPress={onPrevious}>
          Anterior
        </Button>
        <View className="flex-1 items-center">
          <Text className="text-base font-semibold capitalize text-foreground">
            {cycle ? formatReferenceMonth(cycle.referenceMonth, cycle.referenceYear) : 'Sem ciclo'}
          </Text>
          {cycle ? (
            <Text className="text-xs text-muted-foreground">
              {formatDateBr(cycle.startsAt)} a {formatDateBr(cycle.endsAt)}
            </Text>
          ) : (
            <Text className="text-center text-xs text-muted-foreground">
              Cadastre um gasto para criar o primeiro ciclo.
            </Text>
          )}
        </View>
        <Button size="sm" variant="secondary" disabled={disableNext} onPress={onNext}>
          Proximo
        </Button>
      </View>
    </View>
  );
}

function ViewModeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={[
        'min-h-10 flex-1 items-center justify-center rounded-md',
        active ? 'bg-primary' : 'bg-transparent',
      ].join(' ')}
      onPress={onPress}>
      <Text className={active ? 'font-semibold text-white' : 'font-semibold text-foreground'}>
        {label}
      </Text>
    </Pressable>
  );
}

function CycleMetrics({
  cycle,
  error,
  isError,
  isLoading,
  metrics,
  onRetry,
}: {
  cycle: ExpenseCycleResponse | null;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  metrics?: ExpenseCycleMetricsResponse;
  onRetry: () => void;
}) {
  if (!cycle) {
    return (
      <View className="items-center gap-3 rounded-2xl border border-border bg-card p-6">
        <Text className="text-lg font-semibold text-foreground">Nenhum ciclo criado</Text>
        <Text className="text-center text-sm text-muted-foreground">
          O primeiro ciclo sera criado automaticamente ao cadastrar um gasto.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="gap-3">
        <View className="h-28 rounded-2xl border border-border bg-muted" />
        <View className="h-28 rounded-2xl border border-border bg-muted" />
      </View>
    );
  }

  if (isError || !metrics) {
    return (
      <View className="gap-3 rounded-2xl border border-border bg-card p-5">
        <Text className="text-lg font-semibold text-foreground">
          Nao foi possivel carregar as metricas
        </Text>
        <Text className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Tente novamente.'}
        </Text>
        <Button variant="secondary" onPress={onRetry}>
          Tentar novamente
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="gap-2 rounded-2xl border border-border bg-card p-4">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          Saldo do ciclo
        </Text>
        <Text
          className={[
            'text-3xl font-semibold',
            metrics.remainingAmount < 0 ? 'text-destructive' : 'text-foreground',
          ].join(' ')}>
          {formatCurrencyBr(metrics.remainingAmount)}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {formatCurrencyBr(metrics.totalSpent)} gastos de {formatCurrencyBr(metrics.spendingGoal)}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <MetricCard
          label="Disponivel por dia"
          value={formatCurrencyBr(metrics.remainingDailyAmount)}
        />
        <MetricCard label="Gastos pontuais" value={formatCurrencyBr(metrics.oneTimeTotal)} />
      </View>
      <View className="flex-row gap-2">
        <MetricCard
          label="Parcelas futuras"
          value={formatCurrencyBr(metrics.installmentTotalFromCurrentCycle)}
        />
        <MetricCard label="Recorrencias" value={formatCurrencyBr(metrics.recurringMonthlyTotal)} />
      </View>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-h-24 flex-1 justify-between rounded-2xl border border-border bg-card p-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{label}</Text>
      <Text className="text-lg font-semibold text-foreground">{value}</Text>
    </View>
  );
}

function CycleExpenseList({
  cycle,
  deletingExpenseId,
  error,
  expenses,
  isError,
  isLoading,
  onDelete,
  onNewExpense,
  onRetry,
}: {
  cycle: ExpenseCycleResponse | null;
  deletingExpenseId: string | null;
  error: unknown;
  expenses?: ExpenseResponse[];
  isError: boolean;
  isLoading: boolean;
  onDelete: (expenseId: string) => void;
  onNewExpense: () => void;
  onRetry: () => void;
}) {
  return (
    <ListRequestState
      data={cycle ? expenses : []}
      emptyMessage={
        cycle
          ? 'Nenhum gasto registrado neste ciclo.'
          : 'Cadastre um gasto para criar o primeiro ciclo.'
      }
      error={error}
      isError={isError}
      isLoading={isLoading}
      onRetry={onRetry}
      renderEmptyAction={() => <Button onPress={onNewExpense}>Cadastrar gasto</Button>}
      renderItem={(expense) => (
        <ExpenseCard
          expense={expense}
          isDeleting={deletingExpenseId === expense.id}
          key={expense.id}
          onDelete={() => onDelete(expense.id)}
        />
      )}
    />
  );
}

function ExpenseCard({
  expense,
  isDeleting,
  onDelete,
}: {
  expense: ExpenseResponse;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const typeLabel: Record<ExpenseType, string> = {
    INSTALLMENT: expense.installmentNumber
      ? `Parcela ${expense.installmentNumber}/${expense.installmentTotal}`
      : 'Parcelado',
    ONE_TIME: 'Pontual',
    RECURRING: 'Recorrente',
  };

  return (
    <View className="relative gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: expense.category.color }}>
          <Ionicons color="#ffffff" name={getCategoryIcon(expense.category.icon)} size={22} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">{expense.description}</Text>
          <Text className="text-xs text-muted-foreground">
            {expense.category.name} · {typeLabel[expense.type]} ·{' '}
            {formatDateBr(expense.expenseDate)}
          </Text>
        </View>
        <Text className="text-base font-semibold text-foreground">
          {formatCurrencyBr(expense.amount)}
        </Text>
        <CardActionsMenu
          accessibilityLabel="Abrir acoes do gasto"
          actions={[
            {
              disabled: true,
              label: 'Editar',
              onPress: () => undefined,
            },
            {
              disabled: isDeleting,
              label: 'Excluir',
              loading: isDeleting,
              loadingLabel: 'Excluindo...',
              onPress: onDelete,
              variant: 'destructive',
            },
          ]}
        />
      </View>
    </View>
  );
}

function FloatingFinancialActions({
  isOpen,
  onCategory,
  onExpense,
  onToggle,
}: {
  isOpen: boolean;
  onCategory: () => void;
  onExpense: () => void;
  onToggle: () => void;
}) {
  const palette = useThemePalette();

  return (
    <View className="absolute bottom-7 right-5 items-end gap-3">
      {isOpen ? (
        <>
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-2 rounded-full border border-border bg-card px-4 py-3"
            onPress={onCategory}>
            <Ionicons color={palette.primary} name="pricetag-outline" size={20} />
            <Text className="font-semibold text-foreground">Nova categoria</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-2 rounded-full border border-border bg-card px-4 py-3"
            onPress={onExpense}>
            <Ionicons color={palette.primary} name="receipt-outline" size={20} />
            <Text className="font-semibold text-foreground">Novo gasto</Text>
          </Pressable>
        </>
      ) : null}
      <Pressable
        accessibilityLabel={isOpen ? 'Fechar acoes' : 'Abrir acoes'}
        accessibilityRole="button"
        className="h-14 w-14 items-center justify-center rounded-full bg-primary"
        onPress={onToggle}>
        <Ionicons color="#ffffff" name={isOpen ? 'close' : 'add'} size={30} />
      </Pressable>
    </View>
  );
}

function ExpenseFormDrawer({
  categories,
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  categories: ExpenseCategoryResponse[];
  form: ReturnType<typeof useForm<ExpenseFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => void;
}) {
  const type = form.watch('type');
  const amountMode = form.watch('amountMode');
  const dateLabel =
    type === 'INSTALLMENT'
      ? 'Data da primeira parcela'
      : type === 'RECURRING'
        ? 'Inicio da recorrencia'
        : 'Data do gasto';

  return (
    <BottomDrawer contentClassName="gap-3" maxHeight="95%" onClose={onClose} visible={isOpen}>
      <ScrollView contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
        <Text className="text-xl font-semibold text-foreground">Novo gasto</Text>
        <FormProvider {...form}>
          <ExpenseTypeControl form={form} />
          <ControlledSelect
            label="Categoria"
            name="categoryId"
            options={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
          />
          <ControlledInput label="Descricao" name="description" placeholder="Ex: Mercado" />
          {type === 'INSTALLMENT' ? <AmountModeControl form={form} /> : null}
          <ControlledInput
            keyboardType="decimal-pad"
            label={
              type === 'INSTALLMENT' && amountMode === 'INSTALLMENT'
                ? 'Valor da parcela'
                : type === 'INSTALLMENT'
                  ? 'Valor total'
                  : 'Valor'
            }
            name="amount"
            placeholder="250,90"
          />
          {type === 'INSTALLMENT' ? (
            <ControlledInput
              keyboardType="number-pad"
              label="Quantidade de parcelas"
              name="installments"
              placeholder="10"
            />
          ) : null}
          <ControlledDateInput label={dateLabel} name="date" />
          <View className="flex-row gap-2 pt-2">
            <Button className="flex-1" variant="secondary" onPress={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" isLoading={isPending} onPress={form.handleSubmit(onSubmit)}>
              Salvar
            </Button>
          </View>
        </FormProvider>
      </ScrollView>
    </BottomDrawer>
  );
}

function ExpenseTypeControl({ form }: { form: ReturnType<typeof useForm<ExpenseFormData>> }) {
  const type = form.watch('type');
  const options: { label: string; value: ExpenseType }[] = [
    { label: 'Pontual', value: 'ONE_TIME' },
    { label: 'Parcelado', value: 'INSTALLMENT' },
    { label: 'Recorrente', value: 'RECURRING' },
  ];

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">Tipo</Text>
      <View className="flex-row rounded-md border border-border bg-muted p-1">
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            className={[
              'min-h-10 flex-1 items-center justify-center rounded-md px-2',
              type === option.value ? 'bg-primary' : 'bg-transparent',
            ].join(' ')}
            key={option.value}
            onPress={() => form.setValue('type', option.value, { shouldValidate: true })}>
            <Text
              className={
                type === option.value
                  ? 'text-center text-xs font-semibold text-white'
                  : 'text-center text-xs font-semibold text-foreground'
              }>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AmountModeControl({ form }: { form: ReturnType<typeof useForm<ExpenseFormData>> }) {
  const mode = form.watch('amountMode');

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">Forma do valor</Text>
      <View className="flex-row rounded-md border border-border bg-muted p-1">
        <Pressable
          accessibilityRole="button"
          className={[
            'min-h-10 flex-1 items-center justify-center rounded-md',
            mode === 'TOTAL' ? 'bg-primary' : 'bg-transparent',
          ].join(' ')}
          onPress={() => form.setValue('amountMode', 'TOTAL')}>
          <Text
            className={
              mode === 'TOTAL' ? 'font-semibold text-white' : 'font-semibold text-foreground'
            }>
            Valor total
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className={[
            'min-h-10 flex-1 items-center justify-center rounded-md',
            mode === 'INSTALLMENT' ? 'bg-primary' : 'bg-transparent',
          ].join(' ')}
          onPress={() => form.setValue('amountMode', 'INSTALLMENT')}>
          <Text
            className={
              mode === 'INSTALLMENT' ? 'font-semibold text-white' : 'font-semibold text-foreground'
            }>
            Por parcela
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CategoryFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ExpenseCategoryFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseCategoryFormData) => void;
}) {
  const palette = useThemePalette();

  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">Nova categoria</Text>
      <FormProvider {...form}>
        <ControlledInput label="Nome" name="name" placeholder="Ex: Alimentacao" />
        <ControlledColorSwatches label="Cor" name="color" />
        <ControlledSelect
          label="Icone"
          name="icon"
          options={categoryIconOptions}
          renderOption={(option, { selected }) => (
            <CategoryIconSelectOption
              color={selected ? palette.primary : palette.foreground}
              label={option.label}
              value={option.value}
            />
          )}
          renderValue={(option) => (
            <CategoryIconSelectOption
              color={palette.foreground}
              label={option.label}
              value={option.value}
            />
          )}
        />
        <View className="flex-row gap-2 pt-2">
          <Button className="flex-1" variant="secondary" onPress={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" isLoading={isPending} onPress={form.handleSubmit(onSubmit)}>
            Salvar
          </Button>
        </View>
      </FormProvider>
    </BottomDrawer>
  );
}

function CategoryIconSelectOption({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-secondary">
        <Ionicons color={color} name={getCategoryIcon(value)} size={20} />
      </View>
      <Text className="text-base font-semibold text-foreground">{label}</Text>
    </View>
  );
}

function getCategoryIcon(icon: string): keyof typeof Ionicons.glyphMap {
  return icon in Ionicons.glyphMap ? (icon as keyof typeof Ionicons.glyphMap) : 'pricetag-outline';
}

function parseDecimal(value: string) {
  return Number(value.replace(',', '.'));
}
