import { getAbmConfig } from './abm.config';
import { AbmSessionManager } from './abm.session-manager';

export * from './abm.routes';
export * from './abm.dashboard.service';
export * from './abm.errors';

let abmSessionManager: AbmSessionManager | null = null;

export const getAbmSessionManager = (): AbmSessionManager => {
  if (!abmSessionManager) {
    abmSessionManager = new AbmSessionManager(getAbmConfig());
  }

  return abmSessionManager;
};

export const resetAbmSessionManager = (): void => {
  abmSessionManager = null;
};
