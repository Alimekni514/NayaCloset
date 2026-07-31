import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import type { AppEnv } from '../types/env';

const envDirectory = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(envDirectory, '..', '..');
const repoRoot = resolve(apiRoot, '..', '..');

const parseEnvFile = (filePath: string): Record<string, string> => {
  if (!existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/u);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
};

const loadEnvironmentFiles = (): void => {
  const candidateFiles = [
    resolve(repoRoot, '.env'),
    resolve(apiRoot, '.env'),
  ];
  const mergedFileValues: Record<string, string> = {};

  for (const filePath of candidateFiles) {
    const values = parseEnvFile(filePath);
    Object.assign(mergedFileValues, values);
  }

  for (const [key, value] of Object.entries(mergedFileValues)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadEnvironmentFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.url(),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().optional().default(''),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true')
    .pipe(z.boolean())
    .default(false),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
  ABM_BASE_URL: z.string().trim().optional().default(''),
  ABM_USERNAME: z.string().trim().optional().default(''),
  ABM_PASSWORD: z.string().trim().optional().default(''),
  ABM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isTest: parsedEnv.NODE_ENV === 'test',
  appEnv: parsedEnv.NODE_ENV as AppEnv,
  diagnostics: {
    abmBaseUrlConfigured: Boolean(parsedEnv.ABM_BASE_URL),
    abmUsernameConfigured: Boolean(parsedEnv.ABM_USERNAME),
    abmPasswordConfigured: Boolean(parsedEnv.ABM_PASSWORD),
    abmTimeoutConfigured: Number.isFinite(parsedEnv.ABM_REQUEST_TIMEOUT_MS),
    cwd: process.cwd(),
  },
};
