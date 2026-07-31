import { z } from 'zod';

import { loginSchema, registerSchema } from '@delivery-commerce/shared';

export const authCookiesSchema = z.object({
  refreshToken: z.string().min(1),
});

export { loginSchema, registerSchema };
