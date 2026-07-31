import pino from 'pino';

import { env } from './env';

export const logger = pino({
  level: env.isTest ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.__RequestVerificationToken',
      'req.body.passwordHash',
      'response.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isProduction
    ? {}
    : {
        target: 'pino-pretty',
        options: { colorize: true },
      }),
});
