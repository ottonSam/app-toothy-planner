import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { calendarResponseSchema } from '@/schemas/api';
import type { CalendarResponse } from '@/types/api';

const calendarListSchema = z.array(calendarResponseSchema);

export type CalendarRequest = {
  description: string;
  goalIds?: string[];
  starts: string;
  weeks: number;
};

export function listCalendars() {
  return apiRequest<CalendarResponse[]>('/calendars', {
    schema: calendarListSchema,
  });
}

export function createCalendar(body: CalendarRequest) {
  return apiRequest<CalendarResponse, CalendarRequest>('/calendars', {
    method: 'POST',
    body,
    schema: calendarResponseSchema,
  });
}

export function updateCalendar(id: string, body: CalendarRequest) {
  return apiRequest<CalendarResponse, CalendarRequest>(`/calendars/${id}`, {
    method: 'PUT',
    body,
    schema: calendarResponseSchema,
  });
}
