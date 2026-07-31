import type { AuthUser, LoginPayload, RegisterPayload } from '../auth-types';

import { apiClient } from '@/lib/api-client';

export const authApi = {
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<{ user: AuthUser }>('/auth/me');
    return response.data.user;
  },
  async login(payload: LoginPayload): Promise<AuthUser> {
    const response = await apiClient.post<{ user: AuthUser }>('/auth/login', payload);
    return response.data.user;
  },
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const response = await apiClient.post<{ user: AuthUser }>('/auth/register', payload);
    return response.data.user;
  },
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
  async refresh(): Promise<AuthUser> {
    const response = await apiClient.post<{ user: AuthUser }>('/auth/refresh');
    return response.data.user;
  },
};
