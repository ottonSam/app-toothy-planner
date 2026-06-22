import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { listCalendars } from '@/api/calendars';
import { createGoal, deleteGoal, listGoals, updateGoal } from '@/api/goals';
import { ActionConfirmationDrawer } from '@/components/action-confirmation-drawer';
import { DeleteConfirmationDrawer } from '@/components/delete-confirmation-drawer';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ControlledSelect } from '@/components/forms/controlled-select';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { goalTypeLabels } from '@/lib/labels';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import { goalFormSchema, type GoalFormData } from '@/schemas/forms';
import type { CalendarResponse, GoalResponse, GoalType } from '@/types/api';

type ObjectivesScreenProps = DrawerScreenProps<RootDrawerParamList, 'Objectives'>;

const goalGroups: GoalType[] = ['LONG_TERM', 'MEDIUM_TERM', 'CALENDAR'];

export function ObjectivesScreen({ navigation }: ObjectivesScreenProps) {
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [editingGoal, setEditingGoal] = useState<GoalResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);
  const [goalPendingCompletion, setGoalPendingCompletion] = useState<GoalResponse | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [goalPendingDeletion, setGoalPendingDeletion] = useState<GoalResponse | null>(null);

  const goalsQuery = useQuery({ queryKey: queryKeys.goals, queryFn: listGoals });
  const calendarsQuery = useQuery({ queryKey: queryKeys.calendars, queryFn: listCalendars });

  const groupedGoals = useMemo(() => {
    const goals = goalsQuery.data ?? [];
    return goalGroups.map((type) => ({
      type,
      pending: goals.filter((goal) => goal.type === type && !goal.isComplete),
      completed: goals.filter((goal) => goal.type === type && goal.isComplete),
    }));
  }, [goalsQuery.data]);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { name: '', type: 'LONG_TERM' },
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
    form.reset({ name: '', type: 'LONG_TERM' });
  };

  const saveGoalMutation = useMutation({
    mutationFn: (data: GoalFormData) =>
      editingGoal
        ? updateGoal(editingGoal.id, { ...data, isComplete: editingGoal.isComplete })
        : createGoal({ ...data, isComplete: false }),
    onError: feedback.showError,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      feedback.showSuccess(
        editingGoal ? 'Objetivo atualizado com sucesso.' : 'Objetivo criado com sucesso.'
      );
      closeForm();
    },
  });

  const completeGoalMutation = useMutation({
    mutationFn: (goal: GoalResponse) =>
      updateGoal(goal.id, { name: goal.name, type: goal.type, isComplete: true }),
    onError: feedback.showError,
    onMutate: (goal) => setCompletingGoalId(goal.id),
    onSettled: () => setCompletingGoalId(null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      feedback.showSuccess('Objetivo concluido com sucesso.');
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onError: feedback.showError,
    onMutate: (goalId) => setDeletingGoalId(goalId),
    onSettled: () => setDeletingGoalId(null),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
        queryClient.invalidateQueries({ queryKey: queryKeys.calendars }),
      ]);
      feedback.showSuccess('Objetivo excluido com sucesso.');
    },
  });

  const openCreateForm = () => {
    setEditingGoal(null);
    form.reset({ name: '', type: 'LONG_TERM' });
    setIsFormOpen(true);
  };

  const openEditForm = (goal: GoalResponse) => {
    if (goal.isComplete) {
      feedback.showError(new Error('Objetivos concluidos nao podem ser editados.'));
      return;
    }

    setEditingGoal(goal);
    form.reset({ name: goal.name, type: goal.type });
    setIsFormOpen(true);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView>
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityLabel="Abrir menu"
            accessibilityRole="button"
            onPress={() => navigation.openDrawer()}>
            <Ionicons color={palette.foreground} name="menu" size={28} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-semibold text-foreground">Objetivos</Text>
            <Text className="text-sm text-muted-foreground">
              Acompanhe seus objetivos por tipo.
            </Text>
          </View>
          <Button size="sm" onPress={openCreateForm}>
            Novo
          </Button>
        </View>

        <ListRequestState
          data={goalsQuery.data}
          emptyMessage="Crie seu primeiro objetivo para iniciar o planejamento."
          error={goalsQuery.error}
          isError={goalsQuery.isError}
          isLoading={goalsQuery.isLoading}
          onRetry={() => goalsQuery.refetch()}
          renderEmptyAction={() => <Button onPress={openCreateForm}>Criar objetivo</Button>}
          renderItem={() => null}
        />

        {goalsQuery.isSuccess && goalsQuery.data.length > 0
          ? groupedGoals.map((group) => (
              <GoalGroup
                calendars={calendarsQuery.data ?? []}
                completingGoalId={completingGoalId}
                deletingGoalId={deletingGoalId}
                group={group}
                key={group.type}
                onComplete={setGoalPendingCompletion}
                onDelete={setGoalPendingDeletion}
                onEdit={openEditForm}
              />
            ))
          : null}
      </ScreenScrollView>

      <GoalFormDrawer
        form={form}
        isOpen={isFormOpen}
        isPending={saveGoalMutation.isPending}
        onClose={closeForm}
        onSubmit={(data) => saveGoalMutation.mutate(data)}
        title={editingGoal ? 'Editar objetivo' : 'Novo objetivo'}
      />
      <ActionConfirmationDrawer
        confirmLabel="Concluir"
        description="O objetivo sera marcado como concluido e nao podera mais ser editado."
        itemName={goalPendingCompletion?.name}
        onCancel={() => setGoalPendingCompletion(null)}
        onConfirm={() => {
          if (goalPendingCompletion) {
            completeGoalMutation.mutate(goalPendingCompletion);
          }
        }}
        title="Concluir objetivo?"
        visible={Boolean(goalPendingCompletion)}
      />
      <DeleteConfirmationDrawer
        description="O objetivo sera removido permanentemente. Esta acao nao pode ser desfeita."
        itemName={goalPendingDeletion?.name}
        onCancel={() => setGoalPendingDeletion(null)}
        onConfirm={() => {
          if (goalPendingDeletion) {
            deleteGoalMutation.mutate(goalPendingDeletion.id);
          }
        }}
        title="Excluir objetivo?"
        visible={Boolean(goalPendingDeletion)}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function GoalGroup({
  calendars,
  completingGoalId,
  deletingGoalId,
  group,
  onComplete,
  onDelete,
  onEdit,
}: {
  calendars: CalendarResponse[];
  completingGoalId: string | null;
  deletingGoalId: string | null;
  group: { completed: GoalResponse[]; pending: GoalResponse[]; type: GoalType };
  onComplete: (goal: GoalResponse) => void;
  onDelete: (goal: GoalResponse) => void;
  onEdit: (goal: GoalResponse) => void;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-foreground">{goalTypeLabels[group.type]}</Text>
        <Text className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
          {group.pending.length + group.completed.length}
        </Text>
      </View>

      {group.pending.length === 0 && group.completed.length === 0 ? (
        <View className="rounded-2xl border border-dashed border-border bg-card p-4">
          <Text className="text-sm text-muted-foreground">Nenhum objetivo neste grupo.</Text>
        </View>
      ) : null}

      {group.pending.map((goal) => (
        <GoalCard
          calendars={calendars}
          goal={goal}
          isCompleting={completingGoalId === goal.id}
          isDeleting={deletingGoalId === goal.id}
          key={goal.id}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}

      {group.completed.length ? (
        <View className="gap-3 pt-1">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Concluidos</Text>
          {group.completed.map((goal) => (
            <GoalCard
              calendars={calendars}
              goal={goal}
              isDeleting={deletingGoalId === goal.id}
              key={goal.id}
              onComplete={onComplete}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function GoalCard({
  calendars,
  goal,
  isCompleting,
  isDeleting,
  onComplete,
  onDelete,
  onEdit,
}: {
  calendars: CalendarResponse[];
  goal: GoalResponse;
  isCompleting?: boolean;
  isDeleting: boolean;
  onComplete: (goal: GoalResponse) => void;
  onDelete: (goal: GoalResponse) => void;
  onEdit: (goal: GoalResponse) => void;
}) {
  const linkedCalendar =
    goal.type === 'CALENDAR'
      ? calendars.find((calendar) => calendar.goalIds.includes(goal.id))
      : null;

  return (
    <View
      className={[
        'gap-3 rounded-2xl border bg-card p-4',
        goal.isComplete ? 'border-success/50' : 'border-border',
      ].join(' ')}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">{goal.name}</Text>
          <Text className="text-xs font-semibold uppercase text-muted-foreground">
            {goalTypeLabels[goal.type]}
          </Text>
          {linkedCalendar ? (
            <Text className="text-sm text-muted-foreground">
              Calendario: {linkedCalendar.description}
            </Text>
          ) : null}
        </View>
        <Text
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold',
            goal.isComplete ? 'bg-success text-white' : 'bg-warning text-white',
          ].join(' ')}>
          {goal.isComplete ? 'Concluido' : 'Pendente'}
        </Text>
      </View>
      <View className="flex-row gap-2">
        {!goal.isComplete ? (
          <>
            <Button className="flex-1" size="sm" variant="secondary" onPress={() => onEdit(goal)}>
              Editar
            </Button>
            <Button
              className="flex-1"
              isLoading={isCompleting}
              size="sm"
              onPress={() => onComplete(goal)}>
              Concluir
            </Button>
          </>
        ) : null}
        <Button
          className="flex-1"
          isLoading={isDeleting}
          size="sm"
          variant="destructive"
          onPress={() => onDelete(goal)}>
          Excluir
        </Button>
      </View>
    </View>
  );
}

function GoalFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
  title,
}: {
  form: ReturnType<typeof useForm<GoalFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  title: string;
}) {
  return (
    <BottomDrawer onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">{title}</Text>
      <FormProvider {...form}>
        <ControlledInput label="Titulo" name="name" placeholder="Ex: Aumentar faturamento" />
        <ControlledSelect
          label="Tipo"
          name="type"
          options={[
            { label: 'Longo prazo', value: 'LONG_TERM' },
            { label: 'Medio prazo', value: 'MEDIUM_TERM' },
            { label: 'Calendario', value: 'CALENDAR' },
          ]}
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
