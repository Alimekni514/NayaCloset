import { z } from 'zod';

import { userRoleSchema } from '../common/enums';

export const emailSchema = z.email().transform((value) => value.trim().toLowerCase());
export const passwordSchema = z.string().min(8).max(72);

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const meSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: userRoleSchema,
  isActive: z.boolean(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MeResponse = z.infer<typeof meSchema>;
