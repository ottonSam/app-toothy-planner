import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { goalResponseSchema, optionResponseSchema } from '@/schemas/api';
import type { GoalResponse, GoalType, OptionResponse } from '@/types/api';

export type GoalRequest = {
  name: string;
  type: GoalType;
  isComplete?: boolean;
};

const goalListSchema = z.array(goalResponseSchema);
const goalTypeListSchema = z.array(optionResponseSchema);

export function listGoals() {
  return apiRequest<GoalResponse[]>('/goals', {
    schema: goalListSchema,
  });
}

export function listGoalTypes() {
  return apiRequest<OptionResponse<GoalType>[]>('/goals/types', {
    schema: goalTypeListSchema,
  });
}

export function createGoal(body: GoalRequest) {
  return apiRequest<GoalResponse, GoalRequest>('/goals', {
    method: 'POST',
    body,
    schema: goalResponseSchema,
  });
}

export function updateGoal(id: string, body: Required<GoalRequest>) {
  return apiRequest<GoalResponse, Required<GoalRequest>>(`/goals/${id}`, {
    method: 'PUT',
    body,
    schema: goalResponseSchema,
  });
}

export function deleteGoal(id: string) {
  return apiRequest<void>(`/goals/${id}`, {
    method: 'DELETE',
  });
}
