import type { ActivityType, GoalType, WeekDay } from '@/types/api';

export const goalTypeLabels: Record<GoalType, string> = {
  LONG_TERM: 'Longo prazo',
  MEDIUM_TERM: 'Medio prazo',
  CALENDAR: 'Calendario',
};

export const weekDayLabels: Record<WeekDay, string> = {
  SUNDAY: 'Domingo',
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terca-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sabado',
};

export const activityTypeLabels: Record<ActivityType, string> = {
  DAYS: 'Dias',
  COUNT: 'Contagem',
  TIME: 'Tempo',
};
