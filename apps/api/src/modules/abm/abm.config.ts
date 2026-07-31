import { env } from '../../config/env';

import { createAbmHttpError } from './abm.errors';
import type { AbmConfig } from './abm.types';

export const getAbmConfig = (): AbmConfig => {
  if (!env.ABM_BASE_URL || !env.ABM_USERNAME || !env.ABM_PASSWORD) {
    throw createAbmHttpError('ABM_CONFIGURATION_ERROR');
  }

  return {
    baseUrl: env.ABM_BASE_URL,
    username: env.ABM_USERNAME,
    password: env.ABM_PASSWORD,
    timeoutMs: env.ABM_REQUEST_TIMEOUT_MS,
  };
};
