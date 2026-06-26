import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { activityResponseSchema } from '@/schemas/api';
import type { ActivityResponse, ActivityType, WeekDay } from '@/types/api';

const activityListSchema = z.array(activityResponseSchema);

export type ActivityRequest = {
  calendarId: string;
  description: string;
  goal: string;
  type: ActivityType;
  week: number;
};

export function listWeekActivities(calendarId: string, week: number) {
  return apiRequest<ActivityResponse[]>(`/calendars/${calendarId}/weeks/${week}/activities`, {
    schema: activityListSchema,
  });
}

export function createActivity(body: ActivityRequest) {
  return apiRequest<ActivityResponse, ActivityRequest>('/activities', {
    method: 'POST',
    body,
    schema: activityResponseSchema,
  });
}

export function updateActivity(id: string, body: ActivityRequest) {
  return apiRequest<ActivityResponse, ActivityRequest>(`/activities/${id}`, {
    method: 'PUT',
    body,
    schema: activityResponseSchema,
  });
}

export function deleteActivity(id: string) {
  return apiRequest<void>(`/activities/${id}`, {
    method: 'DELETE',
  });
}

export function registerDaysProgress(body: { activityId: string; day: WeekDay }) {
  return apiRequest<ActivityResponse, typeof body>('/activities/progress/days', {
    method: 'POST',
    body,
    schema: activityResponseSchema,
  });
}

export function registerCountProgress(body: { activityId: string; value: number }) {
  return apiRequest<ActivityResponse, typeof body>('/activities/progress/count', {
    method: 'POST',
    body,
    schema: activityResponseSchema,
  });
}

export function registerTimeProgress(body: { activityId: string; time: string }) {
  return apiRequest<ActivityResponse, typeof body>('/activities/progress/time', {
    method: 'POST',
    body,
    schema: activityResponseSchema,
  });
}
