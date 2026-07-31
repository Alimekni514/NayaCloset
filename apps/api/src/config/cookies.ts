import type { CookieOptions } from 'express';

import { env } from './env';

export const buildCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  sameSite: env.COOKIE_SAME_SITE,
  secure: env.COOKIE_SECURE,
  maxAge: maxAgeMs,
  path: '/',
  domain: env.COOKIE_DOMAIN || undefined,
});

export const buildCsrfCookieOptions = (maxAgeMs: number): CookieOptions => ({
  ...buildCookieOptions(maxAgeMs),
  httpOnly: false,
});
