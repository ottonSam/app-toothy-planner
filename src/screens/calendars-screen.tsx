import { zodResolver } from '@hookform/resolvers/zod';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { createCalendar, listCalendars, updateCalendar } from '@/api/calendars';
import { listGoals } from '@/api/goals';
import { CardActionsMenu } from '@/components/card-actions-menu';
import { ControlledDateInput } from '@/components/forms/controlled-date-input';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ListRequestState } from '@/components/list-request-state';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import { weekDayLabels } from '@/lib/labels';
import { formatDateBr } from '@/lib/date-utils';
import { queryKeys } from '@/lib/query-keys';
import type { RootDrawerParamList } from '@/navigation/types';
import { calendarFormSchema, type CalendarFormData } from '@/schemas/forms';
import { CalendarWeekScreen } from '@/screens/calendar-week-screen';
import type { CalendarResponse, GoalResponse } from '@/types/api';

type CalendarsScreenProps = DrawerScreenProps<RootDrawerParamList, 'Calendars'>;

export function CalendarsScreen({ navigation }: CalendarsScreenProps) {
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [editingCalendar, setEditingCalendar] = useState<CalendarResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarResponse | null>(null);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const calendarsQuery = useQuery({ queryKey: queryKeys.calendars, queryFn: listCalendars });
  const goalsQuery = useQuery({ queryKey: queryKeys.goals, queryFn: listGoals });
  const form = useForm<CalendarFormData>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: { description: '', starts: '', weeks: '' },
  });

  const saveCalendarMutation = useMutation({
    mutationFn: (data: CalendarFormData) =>
      editingCalendar
        ? updateCalendar(editingCalendar.id, {
            description: data.description,
            goalIds: selectedGoalIds.length ? selectedGoalIds : undefined,
            starts: data.starts,
            weeks: Number(data.weeks),
          })
        : createCalendar({
            description: data.description,
            goalIds: selectedGoalIds.length ? selectedGoalIds : undefined,
            starts: data.starts,
            weeks: Number(data.weeks),
          }),
    onError: feedback.showError,
    onSuccess: async (savedCalendar) => {
      queryClient.setQueryData<CalendarResponse[]>(queryKeys.calendars, (calendars) => {
        if (!calendars) {
          return calendars;
        }

        return editingCalendar
          ? calendars.map((calendar) =>
              calendar.id === savedCalendar.id ? savedCalendar : calendar
            )
          : [savedCalendar, ...calendars];
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.calendars });
      await queryClient.invalidateQueries({ queryKey: ['user', 'calendars', savedCalendar.id] });
      feedback.showSuccess(
        editingCalendar ? 'Calendario atualizado com sucesso.' : 'Calendario criado com sucesso.'
      );
      closeForm();
    },
  });

  const openForm = () => {
    setEditingCalendar(null);
    form.reset({ description: '', starts: '', weeks: '' });
    setSelectedGoalIds([]);
    setIsFormOpen(true);
  };

  const openEditForm = (calendar: CalendarResponse) => {
    setEditingCalendar(calendar);
    form.reset({
      description: calendar.description,
      starts: calendar.starts,
      weeks: String(calendar.weeks),
    });
    setSelectedGoalIds(calendar.goalIds);
    setIsFormOpen(true);
  };

  if (selectedCalendar) {
    return (
      <CalendarWeekScreen calendar={selectedCalendar} onBack={() => setSelectedCalendar(null)} />
    );
  }

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCalendar(null);
    setSelectedGoalIds([]);
    form.reset({ description: '', starts: '', weeks: '' });
  };

  const goals = goalsQuery.data ?? [];

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
            <Text className="text-3xl font-semibold text-foreground">Calendarios</Text>
            <Text className="text-sm text-muted-foreground">
              Consulte os ciclos semanais cadastrados.
            </Text>
          </View>
          <Button size="sm" onPress={openForm}>
            Novo
          </Button>
        </View>
        <ListRequestState
          data={calendarsQuery.data}
          emptyMessage="Nenhum calendario cadastrado ainda."
          error={calendarsQuery.error}
          isError={calendarsQuery.isError}
          isLoading={calendarsQuery.isLoading}
          onRetry={() => calendarsQuery.refetch()}
          renderEmptyAction={() => <Button onPress={openForm}>Criar calendario</Button>}
          renderItem={(calendar) => (
            <CalendarCard
              calendar={calendar}
              goals={goals}
              key={calendar.id}
              onEdit={() => openEditForm(calendar)}
              onViewWeek={() => setSelectedCalendar(calendar)}
            />
          )}
        />
      </ScreenScrollView>
      <CalendarFormDrawer
        availableGoals={goals.filter(
          (goal) => !goal.isComplete || editingCalendar?.goalIds.includes(goal.id)
        )}
        form={form}
        isOpen={isFormOpen}
        isEditing={Boolean(editingCalendar)}
        isPending={saveCalendarMutation.isPending}
        onClose={closeForm}
        onSubmit={(data) => saveCalendarMutation.mutate(data)}
        selectedGoalIds={selectedGoalIds}
        setSelectedGoalIds={setSelectedGoalIds}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function CalendarCard({
  calendar,
  goals,
  onEdit,
  onViewWeek,
}: {
  calendar: CalendarResponse;
  goals: GoalResponse[];
  onEdit: () => void;
  onViewWeek: () => void;
}) {
  const palette = useThemePalette();
  const linkedGoals = calendar.goalIds
    .map((goalId) => goals.find((goal) => goal.id === goalId))
    .filter((goal): goal is GoalResponse => Boolean(goal));

  return (
    <View className="relative gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{calendar.description}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-muted-foreground">{calendar.weeks} semanas</Text>
            <Text className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
              Ativo
            </Text>
          </View>
        </View>
        <CardActionsMenu
          accessibilityLabel="Abrir acoes do calendario"
          actions={[
            { label: 'Editar', onPress: onEdit },
            {
              disabled: true,
              label: 'Excluir',
              onPress: () => undefined,
              variant: 'destructive',
            },
          ]}
        />
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-3">
          <Text className="text-sm text-muted-foreground">
            Inicio em {formatDateBr(calendar.starts)}.
          </Text>
          <Text className="text-sm text-muted-foreground">
            Semana de {weekDayLabels[calendar.weekStartsOn]} a {weekDayLabels[calendar.weekEndsOn]}.
          </Text>
          <View className="gap-2 rounded-xl bg-muted p-3">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Objetivos vinculados
            </Text>
            {linkedGoals.length ? (
              linkedGoals.map((goal) => (
                <Text className="text-sm font-semibold text-foreground" key={goal.id}>
                  {goal.name}
                </Text>
              ))
            ) : (
              <Text className="text-sm text-muted-foreground">Nenhum objetivo vinculado.</Text>
            )}
          </View>
        </View>
        <Pressable
          accessibilityLabel="Visualizar semana"
          accessibilityRole="button"
          className="h-12 w-12 items-center justify-center rounded-full bg-primary"
          onPress={onViewWeek}>
          <Ionicons color={palette.background} name="chevron-forward" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

function CalendarFormDrawer({
  availableGoals,
  form,
  isEditing,
  isOpen,
  isPending,
  onClose,
  onSubmit,
  selectedGoalIds,
  setSelectedGoalIds,
}: {
  availableGoals: GoalResponse[];
  form: ReturnType<typeof useForm<CalendarFormData>>;
  isEditing: boolean;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: CalendarFormData) => void;
  selectedGoalIds: string[];
  setSelectedGoalIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds((current) =>
      current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId]
    );
  };

  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">
        {isEditing ? 'Editar calendario' : 'Novo calendario'}
      </Text>
      <FormProvider {...form}>
        <ControlledInput label="Titulo" name="description" placeholder="Ex: Calendario Q3" />
        <ControlledInput keyboardType="number-pad" label="Semanas" name="weeks" placeholder="12" />
        <ControlledDateInput label="Data inicial" name="starts" />

        {availableGoals.length ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Objetivos vinculados</Text>
            <View className="gap-2">
              {availableGoals.map((goal) => {
                const isSelected = selectedGoalIds.includes(goal.id);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    className={[
                      'rounded-lg border px-3 py-3',
                      isSelected ? 'border-primary bg-accent' : 'border-border bg-card',
                    ].join(' ')}
                    key={goal.id}
                    onPress={() => toggleGoal(goal.id)}>
                    <Text className="font-semibold text-foreground">{goal.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

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
