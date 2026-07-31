import { abmExternalDashboardResponseSchema } from './abm.external.schemas';
import { createAbmHttpError } from './abm.errors';
import { mapAbmDashboardResponse } from './abm.dashboard.mapper';
import type { AbmDashboardServiceInput, AbmDashboardServiceResult } from './abm.types';
import { getAbmSessionManager } from './index';

export const getAbmDashboard = async ({
  from,
  to,
}: AbmDashboardServiceInput): Promise<AbmDashboardServiceResult> => {
  const payload = await getAbmSessionManager().getDashboardPayload({
    debut: from ?? null,
    fin: to ?? null,
  });

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(payload);
  } catch {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  const externalItems = abmExternalDashboardResponseSchema.parse(parsedJson);

  return mapAbmDashboardResponse(externalItems, {
    from: from ?? null,
    to: to ?? null,
  });
};
