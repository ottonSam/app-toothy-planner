import { z } from 'zod';

import { apiRequest } from '@/api/client';
import {
  dietEntryResponseSchema,
  dietGoalResponseSchema,
  dietMetricsResponseSchema,
  foodResponseSchema,
} from '@/schemas/api';
import type {
  DietEntryResponse,
  DietEntryUnit,
  DietGoalResponse,
  DietMetricsResponse,
  FoodResponse,
} from '@/types/api';

const foodListSchema = z.array(foodResponseSchema);

export type DietGoalRequest = DietGoalResponse;

export type DietEntryRequest = {
  foodName: string;
  quantity: number;
  unit: DietEntryUnit;
  entryDate: string;
};

export function getDietMetrics(date: string) {
  return apiRequest<DietMetricsResponse>(`/diet/metrics?date=${encodeURIComponent(date)}`, {
    schema: dietMetricsResponseSchema,
  });
}

export function getDefaultDietGoal() {
  return apiRequest<DietGoalResponse>('/diet/goals/default', {
    schema: dietGoalResponseSchema,
  });
}

export function updateDefaultDietGoal(body: DietGoalRequest) {
  return apiRequest<DietGoalResponse, DietGoalRequest>('/diet/goals/default', {
    method: 'PUT',
    body,
    schema: dietGoalResponseSchema,
  });
}

export function updateDailyDietGoal(date: string, body: DietGoalRequest) {
  return apiRequest<DietGoalResponse, DietGoalRequest>(
    `/diet/goals/daily?date=${encodeURIComponent(date)}`,
    {
      method: 'PUT',
      body,
      schema: dietGoalResponseSchema,
    }
  );
}

export function listFoods(name = '') {
  const query = name.trim() ? `?name=${encodeURIComponent(name.trim())}` : '';

  return apiRequest<FoodResponse[]>(`/diet/foods${query}`, {
    schema: foodListSchema,
  });
}

export function createDietEntry(body: DietEntryRequest) {
  return apiRequest<DietEntryResponse, DietEntryRequest>('/diet/entries', {
    method: 'POST',
    body,
    schema: dietEntryResponseSchema,
  });
}

export function deleteDietEntry(entryId: string) {
  return apiRequest<void>(`/diet/entries/${entryId}`, {
    method: 'DELETE',
  });
}
