import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  createActivity,
  listWeekActivities,
  registerCountProgress,
  registerDaysProgress,
  registerTimeProgress,
  updateActivity,
} from '@/api/activities';
import { createWeeklyReport, listCalendarReports } from '@/api/reports';
import { ControlledInput } from '@/components/forms/controlled-input';
import { ControlledSelect } from '@/components/forms/controlled-select';
import { ListRequestState } from '@/components/list-request-state';
import { MarkdownReport } from '@/components/markdown-report';
import { MutationStatusDrawer } from '@/components/mutation-status-drawer';
import { ScreenScrollView } from '@/components/screen-scroll-view';
import { BottomDrawer } from '@/components/ui/bottom-drawer';
import { Button } from '@/components/ui/button';
import { useMutationFeedback } from '@/hooks/use-mutation-feedback';
import { useThemePalette } from '@/hooks/use-theme-palette';
import {
  formatDateBr,
  getCalendarWeekEndDate,
  getClosestCalendarWeek,
  isOnOrAfterDate,
} from '@/lib/date-utils';
import { activityTypeLabels, weekDayLabels } from '@/lib/labels';
import { queryKeys } from '@/lib/query-keys';
import {
  activityFormSchema,
  countProgressFormSchema,
  timeProgressFormSchema,
  weeklyReportFormSchema,
  type ActivityFormData,
  type CountProgressFormData,
  type TimeProgressFormData,
  type WeeklyReportFormData,
} from '@/schemas/forms';
import type {
  ActivityResponse,
  CalendarResponse,
  WeekDay,
  WeeklyPerformanceReportResponse,
} from '@/types/api';

type CalendarWeekScreenProps = {
  calendar: CalendarResponse;
  onBack: () => void;
};

const weekDays = Object.entries(weekDayLabels) as [WeekDay, string][];

export function CalendarWeekScreen({ calendar, onBack }: CalendarWeekScreenProps) {
  const queryClient = useQueryClient();
  const feedback = useMutationFeedback();
  const palette = useThemePalette();
  const [week, setWeek] = useState(() => getClosestCalendarWeek(calendar.starts, calendar.weeks));
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityResponse | null>(null);
  const [progressActivity, setProgressActivity] = useState<ActivityResponse | null>(null);
  const activitiesQuery = useQuery({
    queryKey: queryKeys.weekActivities(calendar.id, week),
    queryFn: () => listWeekActivities(calendar.id, week),
  });
  const reportsQuery = useQuery({
    queryKey: queryKeys.calendarReports(calendar.id),
    queryFn: () => listCalendarReports(calendar.id),
  });

  const activityForm = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: { description: '', goal: '', type: 'DAYS' },
  });
  const reportForm = useForm<WeeklyReportFormData>({
    resolver: zodResolver(weeklyReportFormSchema),
    defaultValues: { userFeedback: '' },
  });

  const saveActivityMutation = useMutation({
    mutationFn: (data: ActivityFormData) => {
      const body = {
        calendarId: calendar.id,
        description: data.description,
        goal: data.goal,
        type: data.type,
        week,
      };

      return editingActivity ? updateActivity(editingActivity.id, body) : createActivity(body);
    },
    onError: feedback.showError,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.weekActivities(calendar.id, week),
      });
      feedback.showSuccess(
        editingActivity ? 'Atividade atualizada com sucesso.' : 'Atividade criada com sucesso.'
      );
      activityForm.reset({ description: '', goal: '', type: 'DAYS' });
      setEditingActivity(null);
      setIsActivityFormOpen(false);
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: WeeklyReportFormData) =>
      createWeeklyReport(calendar.id, week, { userFeedback: data.userFeedback }),
    onError: feedback.showError,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.calendarReports(calendar.id) });
      feedback.showSuccess('Relatorio criado com sucesso.');
      reportForm.reset({ userFeedback: '' });
      setIsReportFormOpen(false);
    },
  });

  const invalidateWeek = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.weekActivities(calendar.id, week) });
  };

  const activities = activitiesQuery.data ?? [];
  const progressPercent = activities.length
    ? Math.round(
        activities.reduce((sum, activity) => sum + getActivityProgressPercent(activity), 0) /
          activities.length
      )
    : 0;
  const currentReport = reportsQuery.data?.find((report) => report.week === week);
  const canCreateReport =
    !currentReport && isOnOrAfterDate(getCalendarWeekEndDate(calendar.starts, week));

  const openCreateActivityForm = () => {
    setEditingActivity(null);
    activityForm.reset({ description: '', goal: '', type: 'DAYS' });
    setIsActivityFormOpen(true);
  };

  const openEditActivityForm = (activity: ActivityResponse) => {
    setEditingActivity(activity);
    activityForm.reset({
      description: activity.description,
      goal: formatActivityGoalForForm(activity),
      type: activity.type,
    });
    setIsActivityFormOpen(true);
  };

  const closeActivityForm = () => {
    setIsActivityFormOpen(false);
    setEditingActivity(null);
    activityForm.reset({ description: '', goal: '', type: 'DAYS' });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenScrollView>
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <Pressable accessibilityLabel="Voltar" accessibilityRole="button" onPress={onBack}>
              <Ionicons color={palette.foreground} name="chevron-back" size={28} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-3xl font-semibold text-foreground">Semana {week}</Text>
              <Text className="text-sm text-muted-foreground">{calendar.description}</Text>
            </View>
            <Button size="sm" onPress={openCreateActivityForm}>
              Nova
            </Button>
          </View>

          <View className="gap-3 rounded-2xl border border-border bg-card p-4">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              {formatDateBr(calendar.starts)} - {calendar.weeks} semanas
            </Text>
            <View className="flex-row items-center justify-between gap-3">
              <Button
                size="sm"
                variant="secondary"
                disabled={week === 1}
                onPress={() => setWeek((current) => Math.max(1, current - 1))}>
                Anterior
              </Button>
              <Text className="text-base font-semibold text-foreground">
                Semana {week} de {calendar.weeks}
              </Text>
              <Button
                size="sm"
                variant="secondary"
                disabled={week === calendar.weeks}
                onPress={() => setWeek((current) => Math.min(calendar.weeks, current + 1))}>
                Proxima
              </Button>
            </View>
            <View className="gap-2">
              <View className="h-3 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full bg-success"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </View>
              <Text className="text-sm text-muted-foreground">
                Progresso geral: {progressPercent}%
              </Text>
            </View>
          </View>
        </View>

        <ListRequestState
          data={activitiesQuery.data}
          emptyMessage="Nenhuma atividade cadastrada para esta semana."
          error={activitiesQuery.error}
          isError={activitiesQuery.isError}
          isLoading={activitiesQuery.isLoading}
          onRetry={() => activitiesQuery.refetch()}
          renderEmptyAction={() => (
            <Button onPress={openCreateActivityForm}>Criar atividade</Button>
          )}
          renderItem={(activity) => (
            <ActivityCard
              activity={activity}
              key={activity.id}
              onEdit={() => openEditActivityForm(activity)}
              onProgress={() => setProgressActivity(activity)}
            />
          )}
        />

        <View className="gap-3">
          <Text className="text-xl font-semibold text-foreground">Relatorio da semana</Text>
          <ListRequestState
            data={currentReport ? [currentReport] : []}
            emptyMessage={
              canCreateReport
                ? 'Nenhum relatorio foi criado para esta semana.'
                : 'O relatorio podera ser criado no ultimo dia da semana ou depois.'
            }
            error={reportsQuery.error}
            isError={reportsQuery.isError}
            isLoading={reportsQuery.isLoading}
            onRetry={() => reportsQuery.refetch()}
            renderEmptyAction={() =>
              canCreateReport ? (
                <Button onPress={() => setIsReportFormOpen(true)}>Criar relatorio</Button>
              ) : null
            }
            renderItem={(report) => <WeeklyReportCard key={report.id} report={report} />}
          />
        </View>
      </ScreenScrollView>

      <ActivityFormDrawer
        form={activityForm}
        isOpen={isActivityFormOpen}
        isEditing={Boolean(editingActivity)}
        isPending={saveActivityMutation.isPending}
        onClose={closeActivityForm}
        onSubmit={(data) => saveActivityMutation.mutate(data)}
      />
      <ProgressDrawer
        activity={progressActivity}
        isOpen={Boolean(progressActivity)}
        onClose={() => setProgressActivity(null)}
        onSettled={invalidateWeek}
        showError={feedback.showError}
        showSuccess={feedback.showSuccess}
      />
      <WeeklyReportFormDrawer
        form={reportForm}
        isOpen={isReportFormOpen}
        isPending={createReportMutation.isPending}
        onClose={() => setIsReportFormOpen(false)}
        onSubmit={(data) => createReportMutation.mutate(data)}
      />
      <MutationStatusDrawer
        message={feedback.message}
        onClose={feedback.closeFeedback}
        status={feedback.status}
      />
    </View>
  );
}

function ActivityCard({
  activity,
  onEdit,
  onProgress,
}: {
  activity: ActivityResponse;
  onEdit: () => void;
  onProgress: () => void;
}) {
  const displayGoal =
    activity.type === 'TIME' ? `${activity.goal} min` : `${activity.progress}/${activity.goal}`;
  const displayProgress =
    activity.type === 'TIME' ? `${activity.progress} min` : `${activity.progress}`;
  const percent = Math.round(getActivityProgressPercent(activity));

  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-lg font-semibold text-foreground">{activity.description}</Text>
          <Text className="text-xs font-semibold uppercase text-muted-foreground">
            {activityTypeLabels[activity.type]} - {formatDateBr(activity.weekStartsAt)} a{' '}
            {formatDateBr(activity.weekEndsAt)}
          </Text>
        </View>
        <Text className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
          {percent}%
        </Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-muted">
        <View className="h-full bg-primary" style={{ width: `${Math.min(percent, 100)}%` }} />
      </View>
      <Text className="text-sm text-muted-foreground">
        Progresso: {displayProgress}. Meta: {displayGoal}.
      </Text>
      {activity.progressDays.length ? (
        <Text className="text-sm text-muted-foreground">
          Dias: {activity.progressDays.map((day) => weekDayLabels[day]).join(', ')}
        </Text>
      ) : null}
      <View className="flex-row gap-2">
        <Button className="flex-1" variant="secondary" onPress={onEdit}>
          Editar
        </Button>
        <Button className="flex-1" onPress={onProgress}>
          Marcar progresso
        </Button>
      </View>
    </View>
  );
}

function WeeklyReportCard({ report }: { report: WeeklyPerformanceReportResponse }) {
  const expectedTotal = getReportMetricNumber(report, 'expectedTotal');
  const deliveredTotal = getReportMetricNumber(report, 'deliveredTotal');
  const deliveryPercentage = getReportMetricNumber(report, 'deliveryPercentage');

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="gap-1">
        <Text className="text-lg font-semibold text-foreground">Semana {report.week}</Text>
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          {formatDateBr(report.weekStartsAt)} a {formatDateBr(report.weekEndsAt)}
        </Text>
      </View>

      <View className="flex-row gap-2">
        <ReportMetric label="Esperado" value={expectedTotal} />
        <ReportMetric label="Entregue" value={deliveredTotal} />
        <ReportMetric
          label="Conclusao"
          value={deliveryPercentage === null ? null : `${Math.round(deliveryPercentage)}%`}
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-semibold text-foreground">Feedback enviado</Text>
        <Text className="text-sm text-muted-foreground">{report.userFeedback}</Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Relatorio</Text>
        <MarkdownReport markdown={report.markdownReport} />
      </View>

      <Text className="text-xs text-muted-foreground">
        Criado em {formatDateBr(new Date(report.createdAt))}
      </Text>
    </View>
  );
}

function ReportMetric({ label, value }: { label: string; value: number | string | null }) {
  return (
    <View className="flex-1 gap-1 rounded-xl bg-muted p-3">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{label}</Text>
      <Text className="text-base font-semibold text-foreground">{value ?? '-'}</Text>
    </View>
  );
}

function getReportMetricNumber(report: WeeklyPerformanceReportResponse, key: string) {
  const value = report.metrics[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getActivityProgressPercent(activity: ActivityResponse) {
  if (activity.goal <= 0) {
    return 0;
  }

  return (Math.min(activity.progress, activity.goal) / activity.goal) * 100;
}

function formatActivityGoalForForm(activity: ActivityResponse) {
  if (activity.type !== 'TIME') {
    return String(activity.goal);
  }

  const hours = Math.floor(activity.goal / 60);
  const minutes = activity.goal % 60;
  const hourText = hours ? `${hours}h` : '';
  const minuteText = minutes ? `${minutes}m` : '';

  return [hourText, minuteText].filter(Boolean).join(' ') || '0m';
}

function ActivityFormDrawer({
  form,
  isOpen,
  isEditing,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ActivityFormData>>;
  isOpen: boolean;
  isEditing: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => void;
}) {
  const activityType = form.watch('type');
  const goalPlaceholderByType = {
    COUNT: 'Ex: 5',
    DAYS: 'Ex: 3',
    TIME: 'Ex: 3h 20m',
  };
  const goalDescriptionByType = {
    COUNT: 'Informe a quantidade total esperada na semana.',
    DAYS: 'Informe quantos dias da semana devem ser marcados.',
    TIME: 'Informe a carga total de tempo esperada.',
  };

  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">
        {isEditing ? 'Editar atividade' : 'Nova atividade'}
      </Text>
      <FormProvider {...form}>
        <ControlledInput label="Descricao" name="description" placeholder="Ex: Estudar ingles" />
        <ControlledSelect
          label="Tipo"
          name="type"
          options={[
            { label: 'Dias', value: 'DAYS' },
            { label: 'Contagem', value: 'COUNT' },
            { label: 'Tempo', value: 'TIME' },
          ]}
        />
        <ControlledInput
          description={goalDescriptionByType[activityType]}
          label="Meta"
          name="goal"
          placeholder={goalPlaceholderByType[activityType]}
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

function WeeklyReportFormDrawer({
  form,
  isOpen,
  isPending,
  onClose,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<WeeklyReportFormData>>;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: WeeklyReportFormData) => void;
}) {
  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">Criar relatorio</Text>
      <Text className="text-sm text-muted-foreground">
        Informe um comentario sobre como foi a semana antes de gerar o relatorio.
      </Text>
      <FormProvider {...form}>
        <ControlledInput
          className="min-h-32"
          label="Feedback da semana"
          multiline
          name="userFeedback"
          numberOfLines={5}
          placeholder="Ex: Foi uma semana produtiva, mas concentrei as entregas no fim."
          textAlignVertical="top"
        />
        <View className="flex-row gap-2 pt-2">
          <Button className="flex-1" variant="secondary" onPress={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" isLoading={isPending} onPress={form.handleSubmit(onSubmit)}>
            Gerar
          </Button>
        </View>
      </FormProvider>
    </BottomDrawer>
  );
}

function ProgressDrawer({
  activity,
  isOpen,
  onClose,
  onSettled,
  showError,
  showSuccess,
}: {
  activity: ActivityResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSettled: () => Promise<void>;
  showError: (error: unknown) => void;
  showSuccess: (message: string) => void;
}) {
  const countForm = useForm<CountProgressFormData>({
    resolver: zodResolver(countProgressFormSchema),
    defaultValues: { value: '' },
  });
  const timeForm = useForm<TimeProgressFormData>({
    resolver: zodResolver(timeProgressFormSchema),
    defaultValues: { time: '' },
  });

  const progressMutation = useMutation({
    mutationFn: async (payload: { day?: WeekDay; time?: string; value?: number }) => {
      if (!activity) {
        throw new Error('Atividade nao encontrada.');
      }

      if (activity.type === 'DAYS' && payload.day) {
        return registerDaysProgress({ activityId: activity.id, day: payload.day });
      }

      if (activity.type === 'COUNT' && payload.value) {
        return registerCountProgress({ activityId: activity.id, value: payload.value });
      }

      if (activity.type === 'TIME' && payload.time) {
        return registerTimeProgress({ activityId: activity.id, time: payload.time });
      }

      throw new Error('Informe o progresso antes de enviar.');
    },
    onError: showError,
    onSuccess: async () => {
      await onSettled();
      showSuccess('Progresso registrado com sucesso.');
      countForm.reset({ value: '' });
      timeForm.reset({ time: '' });
      onClose();
    },
  });

  if (!activity) {
    return null;
  }

  return (
    <BottomDrawer maxHeight="90%" onClose={onClose} visible={isOpen}>
      <Text className="text-xl font-semibold text-foreground">Marcar progresso</Text>
      <Text className="text-sm text-muted-foreground">{activity.description}</Text>

      {activity.type === 'DAYS' ? (
        <View className="gap-2">
          {weekDays.map(([day, label]) => {
            const alreadyRegistered = activity.progressDays.includes(day);
            return (
              <Button
                disabled={alreadyRegistered || progressMutation.isPending}
                key={day}
                variant={alreadyRegistered ? 'secondary' : 'outline'}
                onPress={() => progressMutation.mutate({ day })}>
                {alreadyRegistered ? `${label} registrado` : label}
              </Button>
            );
          })}
        </View>
      ) : null}

      {activity.type === 'COUNT' ? (
        <FormProvider {...countForm}>
          <ControlledInput
            keyboardType="number-pad"
            label="Quantidade"
            name="value"
            placeholder="2"
          />
          <Button
            isLoading={progressMutation.isPending}
            onPress={countForm.handleSubmit((data) =>
              progressMutation.mutate({ value: Number(data.value) })
            )}>
            Enviar progresso
          </Button>
        </FormProvider>
      ) : null}

      {activity.type === 'TIME' ? (
        <FormProvider {...timeForm}>
          <ControlledInput label="Tempo" name="time" placeholder="1h 30m" />
          <Button
            isLoading={progressMutation.isPending}
            onPress={timeForm.handleSubmit((data) => progressMutation.mutate({ time: data.time }))}>
            Enviar progresso
          </Button>
        </FormProvider>
      ) : null}

      <Button variant="secondary" onPress={onClose}>
        Cancelar
      </Button>
    </BottomDrawer>
  );
}
