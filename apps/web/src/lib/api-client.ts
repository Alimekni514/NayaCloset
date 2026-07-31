import axios, { AxiosError } from 'axios';

import { webEnv } from './env';

export type ApiError = {
  status: number;
  message: string;
  requestId?: string;
  issues?: unknown;
  details?: unknown;
};

type ErrorPayload = {
  message?: string;
  requestId?: string;
  issues?: unknown;
  details?: unknown;
};

type RetryableConfig = {
  _retry?: boolean;
};

const csrfCookieName = 'dc_csrf_token';
const csrfHeaderName = 'x-csrf-token';

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

const readCsrfToken = (): string | null => readCookie(csrfCookieName);

const createApiError = (error: AxiosError<ErrorPayload>): ApiError => {
  const payload = error.response?.data;

  return {
    status: error.response?.status ?? 0,
    message: payload?.message ?? error.message ?? 'Request failed',
    ...(payload?.requestId ? { requestId: payload.requestId } : {}),
    ...(payload?.issues !== undefined ? { issues: payload.issues } : {}),
    ...(payload?.details !== undefined ? { details: payload.details } : {}),
  };
};

const baseURL =
  webEnv.VITE_API_BASE_URL ??
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'http://localhost:4000/api');

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const csrfToken = readCsrfToken();
  const method = config.method?.toLowerCase();

  if (csrfToken && method && ['post', 'put', 'patch', 'delete'].includes(method)) {
    config.headers.set(csrfHeaderName, csrfToken);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorPayload>) => {
    const status = error.response?.status;
    const originalConfig = error.config as typeof error.config & RetryableConfig;
    const url = originalConfig?.url ?? '';
    const hasRefreshHint = Boolean(readCsrfToken());
    const isRefreshRequest = url.includes('/auth/refresh');
    const isAuthEntry =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me');

    if (
      status === 401 &&
      hasRefreshHint &&
      originalConfig &&
      !originalConfig._retry &&
      !isRefreshRequest &&
      !isAuthEntry
    ) {
      originalConfig._retry = true;

      try {
        await refreshClient.post('/auth/refresh');
        return await apiClient(originalConfig);
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError)) {
          return Promise.reject(createApiError(refreshError));
        }
      }
    }

    if (axios.isAxiosError(error)) {
      return Promise.reject(createApiError(error));
    }

    return Promise.reject(error);
  },
);

export const apiErrorUtils = {
  isApiError(error: unknown): error is ApiError {
    return typeof error === 'object' && error !== null && 'message' in error && 'status' in error;
  },
  readCsrfToken,
  csrfCookieName,
};
