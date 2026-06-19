import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { weeklyPerformanceReportResponseSchema } from '@/schemas/api';
import type { WeeklyPerformanceReportResponse } from '@/types/api';

const weeklyPerformanceReportListSchema = z.array(weeklyPerformanceReportResponseSchema);

export type WeeklyPerformanceReportRequest = {
  userFeedback: string;
};

export function listCalendarReports(calendarId: string) {
  return apiRequest<WeeklyPerformanceReportResponse[]>(`/calendars/${calendarId}/reports`, {
    schema: weeklyPerformanceReportListSchema,
  });
}

export function createWeeklyReport(
  calendarId: string,
  week: number,
  body: WeeklyPerformanceReportRequest
) {
  return apiRequest<WeeklyPerformanceReportResponse, WeeklyPerformanceReportRequest>(
    `/calendars/${calendarId}/weeks/${week}/reports`,
    {
      method: 'POST',
      body,
      schema: weeklyPerformanceReportResponseSchema,
    }
  );
}
