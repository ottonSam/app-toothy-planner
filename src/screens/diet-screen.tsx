import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  createDietEntry,
  deleteDietEntry,
  getDefaultDietGoal,
  getDietMetrics,
  updateDailyDietGoal,
  updateDefaultDietGoal,
} from '@/api/diet';
import { ControlledDateInput } from '@/components/forms/controlled-date-input';
import { ControlledFoodAutocomplete } from '@/components/forms/controlled-food-autocomplete';
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
import {
  addDays,
  formatDateBr,
  formatDateLongBr,
  parseDateOnly,
  toDateInputValue,
} from '@/lib/date-utils';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import {
  dietEntryFormSchema,
  dietGoalFormSchema,
  type DietEntryFormData,
  type DietGoalFormData,
} from '@/schemas/forms';
import type { DietEntryResponse, DietGoalResponse } from '@/types/api';

type DietScreenProps = DrawerScreenProps<RootDrawerParamList, 'Diet'>;
type DietGoalScope = 'DAILY' | 'DEFAULT';

const emptyGoal: DietGoalResponse = {
  kcal: 0,
  protein: 0,
  carbohydrate: 0,
  fat: 0,
};

export function DietScreen({ navigation }: DietScreenProps) {
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<DietEntryResponse | null>(null);

  const dateForm = useForm<{ date: string }>({
    defaultValues: { date: toDateInputValue(new Date()) },
  });
  const selectedDate =
    useWatch({ control: dateForm.control, name: 'date' }) ?? toDateInputValue(new Date());

  const entryForm = useForm<DietEntryFormData>({
    resolver: zodResolver(dietEntryFormSchema),
    defaultValues: { foodName: '', quantity: '', unit: 'GRAMS' },
  });
  const goalForm = useForm<DietGoalFormData>({
    resolver: zodResolver(dietGoalFormSchema),
    defaultValues: {
      carbohydrate: '0',
      fat: '0',
      kcal: '0',
      protein: '0',
      scope: 'DAILY',
    },
  });

  const metricsQuery = useQuery({
    queryKey: queryKeys.dietMetrics(selectedDate),
    queryFn: () => getDietMetrics(selectedDate),
  });
  const defaultGoalQuery = useQuery({
    queryKey: queryKeys.defaultDietGoal,
    queryFn: getDefaultDietGoal,
  });

  const invalidateDietDate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dietMetrics(selectedDate) });
  };

  const entryMutation = useMutation({
    mutationFn: (data: DietEntryFormData) =>
      createDietEntry({
        entryDate: selectedDate,
        foodName: data.foodName,
        quantity: parseDecimal(data.quantity),
        unit: data.unit,
      }),
    onError: feedback.showError,
    onSuccess: async () => {
      await invalidateDietDate();
      await queryClient.invalidateQueries({ queryKey: queryKeys.dietFoodsRoot });
      entryForm.reset({ foodName: '', quantity: '', unit: 'GRAMS' });
      setIsEntryFormOpen(false);
      feedback.showSuccess('Alimento adicionado ao dia.');
    },
  });

  const goalMutation = useMutation({
    mutationFn: (data: DietGoalFormData) => {
      const body = {
        carbohydrate: parseDecimal(data.carbohydrate),
        fat: parseDecimal(data.fat),
        kcal: parseDecimal(data.kcal),
        protein: parseDecimal(data.protein),
      };

      return data.scope === 'DEFAULT'
        ? updateDefaultDietGoal(body)
        : updateDailyDietGoal(selectedDate, body);
    },
    onError: feedback.showError,
    onSuccess: async (_, data) => {
      if (data.scope === 'DEFAULT') {
        await queryClient.invalidateQueries({ queryKey: queryKeys.defaultDietGoal });
        await queryClient.invalidateQueries({ queryKey: ['user', 'diet', 'metrics'] });
      } else {
        await invalidateDietDate();
      }

      setIsGoalFormOpen(false);
      feedback.showSuccess(
        data.scope === 'DEFAULT' ? 'Meta padrao atualizada.' : 'Meta do dia atualizada.'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDietEntry,
    onError: feedback.showError,
    onMutate: (entryId) => setDeletingEntryId(entryId),
    onSettled: () => setDeletingEntryId(null),
    onSuccess: async () => {
      await invalidateDietDate();
      feedback.showSuccess('Entrada removida com sucesso.');
    },
  });

  const changeDate = (days: number) => {
    const nextDate = addDays(parseDateOnly(selectedDate), days);
    dateForm.setValue('date', toDateInputValue(nextDate));
  };

  const openGoalForm = (scope: DietGoalScope) => {
    const goal =
      scope === 'DEFAULT'
        ? (defaultGoalQuery.data ?? emptyGoal)
        : (metricsQuery.data?.goal ?? emptyGoal);

    goalForm.reset({
      carbohydrate: formatFormNumber(goal.carbohydrate),
      fat: formatFormNumber(goal.fat),
      kcal: formatFormNumber(goal.kcal),
      protein: formatFormNumber(goal.protein),
      scope,
    });
    setIsGoalFormOpen(true);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel="Abrir menu"
            accessibilityRole="button"
            onPress={() => navigation.openDrawer()}>
            <Ionicons color={palette.foreground} name="menu" size={28} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-semibold text-foreground">Dieta</Text>
            <Text className="text-sm text-muted-foreground">
              Acompanhe suas metas e alimentacao diaria.
            </Text>
          </View>
        </View>

        <FormProvider {...dateForm}>
          <View className="flex-row items-end gap-2">
            <Pressable
              accessibilityLabel="Dia anterior"
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-md border border-border bg-secondary"
              onPress={() => changeDate(-1)}>
              <Ionicons color={palette.foreground} name="chevron-back" size={22} />
            </Pressable>
            <View className="flex-1">
              <ControlledDateInput label="Dia selecionado" name="date" />
            </View>
            <Pressable
              accessibilityLabel="Proximo dia"
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-md border border-border bg-secondary"
              onPress={() => changeDate(1)}>
              <Ionicons color={palette.foreground} name="chevron-forward" size={22} />
            </Pressable>
          </View>
        </FormProvider>

        <MacroSummary
          error={metricsQuery.error}
          goal={metricsQuery.data?.goal}
          isError={metricsQuery.isError}
          isLoading={metricsQuery.isLoading}
          onRetry={() => metricsQuery.refetch()}
          remaining={metricsQuery.data?.remaining}
          selectedDate={selectedDate}
        />

        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            disabled={!metricsQuery.data}
            variant="secondary"
            onPress={() => openGoalForm('DAILY')}>
            Meta do dia
          </Button>
          <Button
            className="flex-1"
            disabled={defaultGoalQuery.isLoading}
            variant="secondary"
            onPress={() => openGoalForm('DEFAULT')}>
            Meta padrao
          </Button>
        </View>

        <Button onPress={() => setIsEntryFormOpen(true)}>Adicionar alimento</Button>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-foreground">Entradas do dia</Text>
            <Text className="text-sm text-muted-foreground">
              {metricsQuery.data?.entries.length ?? 0}
            </Text>
          </View>
          <ListRequestState
            data={metricsQuery.data?.entries}
            emptyMessage="Nenhum alimento registrado para este dia."
            error={metricsQuery.error}
            isError={metricsQuery.isError}
            isLoading={metricsQuery.isLoading}
            onRetry={() => metricsQuery.refetch()}
            renderEmptyAction={() => (
              <Button onPress={() => setIsEntryFormOpen(true)}>Adicionar alimento</Button>
            )}
            renderItem={(entry) => (
              <DietEntryCard
                entry={entry}
                isDeleting={deletingEntryId === entry.id}
                key={entry.id}
                onDelete={() => setEntryPendingDeletion(entry)}
              />
            )}
          />
        </View>
      </ScreenScrollView>

      <DietEntryFormDrawer
        form={entryForm}
        isOpen={isEntryFormOpen}
        isPending={entryMutation.isPending}
        onClose={() => setIsEntryFormOpen(false)}
        onSubmit={(data) => entryMutation.mutate(data)}
      />
      <DietGoalFormDrawer
        form={goalForm}
        isOpen={isGoalFormOpen}
        isPending={goalMutation.isPending}
        onClose={() => setIsGoalFormOpen(false)}
        onSubmit={(data) => goalMutation.mutate(data)}
        selectedDate={selectedDate}
      />
      <DeleteConfirmationDrawer
        description="Esta entrada sera removida dos macros consumidos no dia. Esta acao nao pode ser desfeita."
        itemName={entryPendingDeletion?.food.name}
        onCancel={() => setEntryPendingDeletion(null)}
        onConfirm={() => {
          if (entryPendingDeletion) {
            deleteMutation.mutate(entryPendingDeletion.id);
          }
        }}
        title="Excluir entrada de alimentacao?"
        visible={Boolean(entryPendingDeletion)}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function MacroSummary({
  error,
  goal,
  isError,
  isLoading,
  onRetry,
  remaining,
  selectedDate,
}: {
  error: unknown;
  goal?: DietGoalResponse;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  remaining?: DietGoalResponse;
  selectedDate: string;
}) {
  if (isLoading) {
    return (
      <View className="gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="h-6 w-48 rounded bg-muted" />
        <View className="h-24 rounded bg-muted" />
      </View>
    );
  }

  if (isError || !remaining || !goal) {
    return (
      <View className="gap-3 rounded-2xl border border-border bg-card p-4">
        <Text className="text-lg font-semibold text-foreground">Macros do dia</Text>
        <Text className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Nao foi possivel carregar os macros.'}
        </Text>
        <Button variant="secondary" onPress={onRetry}>
          Tentar novamente
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View>
        <Text className="text-xl font-semibold text-foreground">Restante do dia</Text>
        <Text className="text-sm capitalize text-muted-foreground">
          {formatDateLongBr(selectedDate)}
        </Text>
      </View>
      <View className="gap-2">
        <View className="flex-row gap-2">
          <MacroCard goal={goal.kcal} label="Calorias" remaining={remaining.kcal} unit="kcal" />
          <MacroCard goal={goal.protein} label="Proteina" remaining={remaining.protein} unit="g" />
        </View>
        <View className="flex-row gap-2">
          <MacroCard
            goal={goal.carbohydrate}
            label="Carboidrato"
            remaining={remaining.carbohydrate}
            unit="g"
          />
          <MacroCard goal={goal.fat} label="Gordura" remaining={remaining.fat} unit="g" />
        </View>
      </View>
    </View>
  );
}

function MacroCard({
  goal,
  label,
  remaining,
  unit,
}: {
  goal: number;
  label: string;
  remaining: number;
  unit: string;
}) {
  const consumed = goal - remaining;

  return (
    <View className="min-h-24 flex-1 justify-between rounded-xl bg-muted p-3">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{label}</Text>
      <Text
        className={[
          'text-xl font-semibold',
          remaining < 0 ? 'text-destructive' : 'text-foreground',
        ].join(' ')}>
        {formatMacro(remaining)} {unit}
      </Text>
      <Text className="text-xs text-muted-foreground">
        {formatMacro(consumed)} de {formatMacro(goal)}
      </Text>
    </View>
  );
}

function DietEntryCard({
  entry,
  isDeleting,
  onDelete,
}: {
  entry: DietEntryResponse;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">{entry.food.name}</Text>
          <Text className="text-sm text-muted-foreground">
            {formatQuantity(entry.quantity)} {entry.unit === 'GRAMS' ? 'gramas' : 'porcoes'}
          </Text>
          {entry.unit === 'PORTIONS' ? (
            <Text className="text-xs text-muted-foreground">{entry.food.portionDescription}</Text>
          ) : null}
        </View>
        <Text className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
          {formatMacro(entry.kcal)} kcal
        </Text>
      </View>

      <View className="flex-row gap-3">
        <EntryMacro label="Proteina" value={entry.protein} />
        <EntryMacro label="Carboidrato" value={entry.carbohydrate} />
        <EntryMacro label="Gordura" value={entry.fat} />
      </View>

      <Button isLoading={isDeleting} variant="destructive" onPress={onDelete}>
        Remover entrada
      </Button>
    </View>
  );
}

function EntryMacro({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{formatMacro(value)} g</Text>
    </View>
  );
}

function DietEntryFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<DietEntryFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: DietEntryFormData) => void;
}) {
  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">Adicionar alimento</Text>
      <FormProvider {...form}>
        <ControlledFoodAutocomplete label="Alimento" name="foodName" />
        <ControlledSelect
          label="Unidade"
          name="unit"
          options={[
            { label: 'Gramas', value: 'GRAMS' },
            { label: 'Porcoes', value: 'PORTIONS' },
          ]}
        />
        <ControlledInput
          keyboardType="decimal-pad"
          label="Quantidade"
          name="quantity"
          placeholder="Ex: 100"
        />
        <View className="flex-row gap-2 pt-2">
          <Button className="flex-1" variant="secondary" onPress={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" isLoading={isPending} onPress={form.handleSubmit(onSubmit)}>
            Adicionar
          </Button>
        </View>
      </FormProvider>
    </BottomDrawer>
  );
}

function DietGoalFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
  selectedDate,
}: {
  form: ReturnType<typeof useForm<DietGoalFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: DietGoalFormData) => void;
  selectedDate: string;
}) {
  const scope = form.watch('scope');

  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <View>
        <Text className="text-xl font-semibold text-foreground">
          {scope === 'DEFAULT' ? 'Meta padrao' : 'Meta do dia'}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {scope === 'DEFAULT'
            ? 'Aplicada aos dias sem uma configuracao especifica.'
            : formatDateBr(selectedDate)}
        </Text>
      </View>
      <FormProvider {...form}>
        <ControlledInput
          keyboardType="decimal-pad"
          label="Calorias (kcal)"
          name="kcal"
          placeholder="2200"
        />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <ControlledInput
              keyboardType="decimal-pad"
              label="Proteina (g)"
              name="protein"
              placeholder="160"
            />
          </View>
          <View className="flex-1">
            <ControlledInput
              keyboardType="decimal-pad"
              label="Carboidrato (g)"
              name="carbohydrate"
              placeholder="250"
            />
          </View>
        </View>
        <ControlledInput
          keyboardType="decimal-pad"
          label="Gordura (g)"
          name="fat"
          placeholder="70"
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

function parseDecimal(value: string) {
  return Number(value.replace(',', '.'));
}

function formatFormNumber(value: number) {
  return String(value).replace('.', ',');
}

function formatMacro(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value);
}
