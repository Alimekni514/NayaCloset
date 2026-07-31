import {
  abmPositionListItemSchema,
  abmPositionsResponseSchema,
  type AbmPositionListItem,
  type AbmPositionStatusCategory,
} from '@delivery-commerce/shared';

import { createAbmHttpError } from '../abm.errors';

import type { AbmExternalPositionListItem } from './abm-position-list.external.schemas';
import type {
  AbmPositionListSummary,
  AbmPositionStatusMapping,
  AbmPositionsQueryInput,
  AbmPositionListResult,
  AbmNormalizedPositionSource,
  NormalizedAbmPositionsQuery,
} from './abm-position-list.types';

const DELIVERED_EVENT_IDS = new Set([25]);
const PROGRESS_EVENT_IDS = new Set([2, 3, 17, 18]);
const ANOMALY_EVENT_IDS = new Set([5, 20, 30]);
const RETURN_EVENT_IDS = new Set([26, 27, 28, 29, 31, 32, 36]);
const CANCELLED_EVENT_IDS = new Set([40, 41, 42]);

const normalizeText = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : undefined;
};

const normalizeRequiredText = (value: string | undefined, fallback: string): string => normalizeText(value) ?? fallback;

const normalizeEmail = (value: string | undefined): string | undefined => {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : undefined;
};

const normalizeNumber = (value: number | undefined): number => (Number.isFinite(value) ? Number(value) : 0);

const createIsoDate = (date: Date): string | null => {
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return date.toISOString();
};

export const parseAbmDate = (value: string | null | undefined): string | null => {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return null;
  }

  const aspNetMatch = normalized.match(/^\/Date\((-?\d+)\)\/$/u);

  if (aspNetMatch) {
    return createIsoDate(new Date(Number(aspNetMatch[1])));
  }

  const isoDateMatch = normalized.match(/^\d{4}-\d{2}-\d{2}$/u);

  if (isoDateMatch) {
    return createIsoDate(new Date(`${normalized}T00:00:00.000Z`));
  }

  return createIsoDate(new Date(normalized));
};

export const mapEventIdToStatus = (eventId: number): AbmPositionStatusMapping => {
  let category: AbmPositionStatusCategory = 'neutral';

  if (eventId === 1) {
    category = 'created';
  } else if (PROGRESS_EVENT_IDS.has(eventId)) {
    category = 'progress';
  } else if (DELIVERED_EVENT_IDS.has(eventId)) {
    category = 'delivered';
  } else if (ANOMALY_EVENT_IDS.has(eventId)) {
    category = 'anomaly';
  } else if (RETURN_EVENT_IDS.has(eventId)) {
    category = 'return';
  } else if (CANCELLED_EVENT_IDS.has(eventId)) {
    category = 'cancelled';
  }

  return {
    category,
    canEdit: eventId === 1,
    canDelete: eventId === 1,
  };
};

export const normalizeAbmPositionsQuery = (query: AbmPositionsQueryInput): NormalizedAbmPositionsQuery => {
  const today = new Date();
  const offsetMs = today.getTimezoneOffset() * 60_000;
  const todayIso = new Date(today.getTime() - offsetMs).toISOString().slice(0, 10);

  const from = query.from ?? todayIso;
  const to = query.to ?? todayIso;

  if ((query.from && !query.to) || (!query.from && query.to)) {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  return {
    from,
    to,
  };
};

export const mapExternalAbmPosition = (item: AbmExternalPositionListItem): AbmPositionListItem => {
  const eventId = normalizeNumber(item.EVENTID);
  const status = mapEventIdToStatus(eventId);
  const recipientFirstName = normalizeText(item.LIV_ADPCONTACTPRENOM);
  const recipientLastName = normalizeRequiredText(item.LIV_ADPCONTACTNOM, 'Destinataire');
  const fullName = [recipientFirstName, recipientLastName].filter(Boolean).join(' ').trim() || recipientLastName;
  const position = abmPositionListItemSchema.parse({
    id: normalizeRequiredText(item.POSID, normalizeRequiredText(item.POSBARCODE, 'unknown-position')),
    barcode: normalizeRequiredText(item.POSBARCODE, normalizeRequiredText(item.POSID, 'Position inconnue')),
    reference: normalizeRequiredText(item.POSREFERENCE, 'Sans reference'),
    createdAt: parseAbmDate(item.DATECREATE),
    pickupDate: parseAbmDate(item.POSDATEENL),
    deliveryDate: parseAbmDate(item.POSDATELIV),
    updatedAt: parseAbmDate(item.DATEUPD),
    departure: {
      ...(normalizeText(item.ENL_LIBELLEN1) ? { governorate: normalizeText(item.ENL_LIBELLEN1) } : {}),
      city: normalizeRequiredText(item.ENL_LIBELLEN2, normalizeRequiredText(item.ENL_LIBELLEN1, 'Non renseignee')),
      locality: normalizeRequiredText(item.ENL_LIBELLEN3, normalizeRequiredText(item.ENL_LIBELLEN2, 'Non renseignee')),
    },
    recipient: {
      ...(recipientFirstName ? { firstName: recipientFirstName } : {}),
      lastName: recipientLastName,
      fullName,
      phone: normalizeRequiredText(item.LIV_ADPPORTABLE, 'Non renseigne'),
      ...(normalizeEmail(item.LIV_EMAIL) ? { email: normalizeEmail(item.LIV_EMAIL) } : {}),
    },
    destination: {
      governorate: normalizeRequiredText(item.LIV_LIBELLEN1, 'Non renseigne'),
      city: normalizeRequiredText(item.LIV_LIBELLEN2, normalizeRequiredText(item.LIV_LIBELLEN1, 'Non renseignee')),
      locality: normalizeRequiredText(item.LIV_LIBELLEN3, normalizeRequiredText(item.LIV_LIBELLEN2, 'Non renseignee')),
      postalCode: normalizeRequiredText(item.LIV_CODEP, 'Non renseigne'),
      ...(normalizeText(item.LIV_ADR1) ? { addressLine1: normalizeText(item.LIV_ADR1) } : {}),
      ...(normalizeText(item.LIV_ADR2) ? { addressLine2: normalizeText(item.LIV_ADR2) } : {}),
    },
    service: normalizeRequiredText(item.SERVICEINTITULE, 'Non renseigne'),
    codAmount: Math.max(0, normalizeNumber(item.COLMNTCOD)),
    eventId,
    statusLabel: normalizeRequiredText(item.STATLIBELLE, 'Statut inconnu'),
    statusCategory: status.category,
    deliveryAttempts: Math.max(0, normalizeNumber(item.POSTENTATIVELIV)),
    pieces: Math.max(0, normalizeNumber(item.POSNBPIECE)),
    permissions: {
      canView: true,
      canEdit: status.canEdit,
      canDelete: status.canDelete,
    },
  });

  return position;
};


export const summarizeNormalizedPositions = (items: AbmNormalizedPositionSource[]): AbmPositionListSummary => ({
  total: items.length,
  totalCod: items.reduce((sum, item) => sum + item.normalized.codAmount, 0),
  delivered: items.filter((item) => item.normalized.statusCategory === 'delivered').length,
  anomalies: items.filter((item) => item.normalized.statusCategory === 'anomaly').length,
});

export const buildAbmPositionsResponse = ({
  items,
  query,
  syncedAt,
}: {
  items: AbmNormalizedPositionSource[];
  query: NormalizedAbmPositionsQuery;
  syncedAt: string;
}): AbmPositionListResult => {
  const summary = summarizeNormalizedPositions(items);

  return abmPositionsResponseSchema.parse({
    items: items.map((item) => item.normalized),
    period: {
      from: query.from,
      to: query.to,
    },
    summary,
    syncedAt,
  });
};
