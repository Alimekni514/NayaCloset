import type { LoginInput, MeResponse, RegisterInput } from '@delivery-commerce/shared';

import type { ApiError } from '@/lib/api-client';

export type AuthUser = MeResponse;
export type LoginPayload = LoginInput;
export type RegisterPayload = RegisterInput;
export type AuthApiError = ApiError;
