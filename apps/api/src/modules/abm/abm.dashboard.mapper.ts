import type { AbmDashboardResponse } from '@delivery-commerce/shared';

import { ABM_SUPPORTED_GROUPS, ABM_TOTAL_EVENT_IDS } from './abm.constants';
import { createAbmHttpError } from './abm.errors';
import type { AbmExternalDashboardItem, AbmNormalizedItem } from './abm.types';

export const mapAbmDashboardResponse = (
  items: AbmExternalDashboardItem[],
  period: { from: string | null; to: string | null },
): AbmDashboardResponse => {
  const totals = {
    positions: 0,
    returns: 0,
    exchanges: 0,
  };

  const groups = {
    POSITION: [] as AbmNormalizedItem[],
    RETOUR: [] as AbmNormalizedItem[],
    ECHANGE: [] as AbmNormalizedItem[],
  };

  for (const item of items) {
    const label = item.EVENTLIBELLE.trim();

    if (!label) {
      throw createAbmHttpError('ABM_BAD_RESPONSE');
    }

    if (item.EVENTID === ABM_TOTAL_EVENT_IDS.POSITION) {
      totals.positions = item.COUNT;
      continue;
    }

    if (item.EVENTID === ABM_TOTAL_EVENT_IDS.RETOUR) {
      totals.returns = item.COUNT;
      continue;
    }

    if (item.EVENTID === ABM_TOTAL_EVENT_IDS.ECHANGE) {
      totals.exchanges = item.COUNT;
      continue;
    }

    if (!ABM_SUPPORTED_GROUPS.includes(item.TYPE as (typeof ABM_SUPPORTED_GROUPS)[number])) {
      continue;
    }

    groups[item.TYPE as keyof typeof groups].push({
      type: item.TYPE as keyof typeof groups,
      eventId: item.EVENTID,
      label,
      count: item.COUNT,
      hasDate: item.HAS_DATE,
    });
  }

  return {
    totals,
    groups,
    period: {
      from: period.from,
      to: period.to,
      filtered: Boolean(period.from && period.to),
    },
    syncedAt: new Date().toISOString(),
  };
};
