import rateLimit from 'express-rate-limit';

import { env } from './env';

export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});

export const guestOrderRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(5, Math.floor(env.RATE_LIMIT_MAX_REQUESTS / 2)),
  standardHeaders: true,
  legacyHeaders: false,
});
