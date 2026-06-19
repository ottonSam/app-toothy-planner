import { z } from 'zod';

import { apiRequest } from '@/api/client';
import { messageResponseSchema, userResponseSchema } from '@/schemas/api';
import type { MessageResponse, UserResponse, UserTheme } from '@/types/api';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = LoginRequest & {
  name: string;
  profileImage: null;
  theme: 'LIGHT';
};

export function login(body: LoginRequest) {
  return apiRequest<MessageResponse, LoginRequest>('/users/login', {
    method: 'POST',
    body,
    schema: messageResponseSchema,
    skipAuthRefresh: true,
  });
}

export function register(body: RegisterRequest) {
  return apiRequest<UserResponse, RegisterRequest>('/users', {
    method: 'POST',
    body,
    schema: userResponseSchema,
    skipAuthRefresh: true,
  });
}

export function requestActivationCode(body: { email: string }) {
  return apiRequest<MessageResponse, { email: string }>('/users/activation-code', {
    method: 'POST',
    body,
    schema: messageResponseSchema,
    skipAuthRefresh: true,
  });
}

export function activateUser(body: { email: string; code: string }) {
  return apiRequest<MessageResponse, { email: string; code: string }>('/users/activate', {
    method: 'POST',
    body,
    schema: messageResponseSchema,
    skipAuthRefresh: true,
  });
}

export function logout() {
  return apiRequest<MessageResponse>('/users/logout', {
    method: 'POST',
    schema: messageResponseSchema,
  });
}

export function getCurrentUser() {
  return apiRequest<UserResponse>('/users/me', {
    schema: userResponseSchema,
  });
}

export type UpdateCurrentUserRequest = {
  name?: string | null;
  password?: string | null;
  theme?: UserTheme | null;
};

export function updateCurrentUser(body: UpdateCurrentUserRequest) {
  return apiRequest<UserResponse, UpdateCurrentUserRequest>('/users/me', {
    method: 'PUT',
    body,
    schema: userResponseSchema,
  });
}

export function updateProfileImage(body: { image: string }) {
  return apiRequest<MessageResponse, typeof body>('/users/image', {
    method: 'PUT',
    body,
    schema: messageResponseSchema,
  });
}

export const userQuerySchema = z.object({
  id: z.string().uuid(),
});
