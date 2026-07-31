import {
  ABM_POSITIONS_SCHEMA_VERSION,
  abmPositionDeleteResponseSchema,
  type AbmPositionsQuery,
} from '@delivery-commerce/shared';
import { ZodError } from 'zod';
import { HttpError } from '../../../lib/http-error';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../../config/logger';
import { env } from '../../../config/env';
import { getAbmSessionManager } from '../index';
import { createAbmHttpError } from '../abm.errors';

import { abmExternalPositionListSchema } from './abm-position-list.external.schemas';
import {
  buildAbmPositionsResponse,
  mapExternalAbmPosition,
  normalizeAbmPositionsQuery,
} from './abm-position-list.mapper';
import type { AbmPositionDeleteResult, AbmPositionListResult } from './abm-position-list.types';

const ABM_POSITIONS_LIST_PATH = '/cPosition';
const ABM_POSITION_DELETE_PATH_PREFIX = '/cPosition/position_Delete/';
const DELETE_SUCCESS_VALUES = new Set(['success']);
const DELETE_NOT_ALLOWED_VALUES = new Set(['invalid']);
const DELETE_FAILURE_VALUES = new Set(['erreur']);

const summarizeParsedPayload = (payload: unknown) => {
  const first = Array.isArray(payload) ? payload[0] : undefined;

  return {
    schemaVersion: ABM_POSITIONS_SCHEMA_VERSION,
    isArray: Array.isArray(payload),
    length: Array.isArray(payload) ? payload.length : null,
    firstType: Array.isArray(payload) ? (Array.isArray(first) ? 'array' : typeof first) : typeof payload,
    firstKeys:
      first && typeof first === 'object' && !Array.isArray(first)
        ? Object.keys(first).slice(0, 20)
        : null,
    firstArrayLength: Array.isArray(first) ? first.length : null,
    firstArrayPreview: Array.isArray(first) ? first.slice(0, 12) : null,
  };
};

const parseListPayload = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload !== 'string') {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  try {
    return JSON.parse(payload) as unknown;
  } catch {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }
};

const normalizeDeleteResponse = (payload: string): AbmPositionDeleteResult => {
  const trimmed = payload.trim();
  let normalized = trimmed.toLowerCase();

  if (/internal server error|<html|<!doctype html/iu.test(trimmed)) {
    throw createAbmHttpError('ABM_POSITION_DELETE_FAILED');
  }

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  if (DELETE_SUCCESS_VALUES.has(normalized)) {
    return abmPositionDeleteResponseSchema.parse({ deleted: true });
  }

  if (DELETE_NOT_ALLOWED_VALUES.has(normalized)) {
    throw createAbmHttpError('ABM_POSITION_DELETE_NOT_ALLOWED');
  }

  if (DELETE_FAILURE_VALUES.has(normalized)) {
    throw createAbmHttpError('ABM_POSITION_DELETE_FAILED');
  }

  throw createAbmHttpError('ABM_BAD_RESPONSE');
};

export const getAbmPositions = async (input: AbmPositionsQuery): Promise<AbmPositionListResult> => {
  const query = normalizeAbmPositionsQuery(input);
  const sessionManager = getAbmSessionManager();
  const sessionBefore = await sessionManager.getCookieDiagnostics();

  if (!env.isProduction) {
    logger.info(
      {
        route: '/api/admin/abm/positions',
        receivedQuery: query,
        validationSuccess: true,
        serviceReached: true,
        upstreamRequestStarted: true,
        abmSessionReused: sessionBefore.applicationCookiePresent,
        applicationCookiePresent: sessionBefore.applicationCookiePresent,
        upstreamPath: ABM_POSITIONS_LIST_PATH,
      },
      'ABM positions list request',
    );
  }

  const response = await sessionManager.getProtectedTextDetailed(
    ABM_POSITIONS_LIST_PATH,
    {
      datestart: query.from,
      dateend: query.to,
    },
    {
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${env.ABM_BASE_URL}${ABM_POSITIONS_LIST_PATH}`,
      },
    },
  );

  const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
  const responseCategory = contentType.includes('application/json')
    ? 'json'
    : /text\/html/iu.test(contentType)
      ? 'login_html'
      : response.status >= 500
        ? 'server_error'
        : 'unexpected';

  if (!env.isProduction) {
    logger.info(
      {
        upstreamPath: ABM_POSITIONS_LIST_PATH,
        upstreamStatus: response.status,
        upstreamContentType: contentType,
        responseCategory,
      },
      'ABM positions list upstream response',
    );
  }

  const parsed = parseListPayload(response.data);

  if (!Array.isArray(parsed)) {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  if (!env.isProduction) {
    logger.info(
      {
        route: '/api/admin/abm/positions',
        payloadShape: summarizeParsedPayload(parsed),
      },
      'ABM positions parsed payload shape',
    );
  }

  let externalItems;
  try {
    externalItems = abmExternalPositionListSchema.parse(parsed);
  } catch (error) {
    if (!env.isProduction) {
      logger.error(
        {
          route: '/api/admin/abm/positions',
          payloadShape: summarizeParsedPayload(parsed),
          zodIssues: error instanceof ZodError ? error.issues : undefined,
        },
        'ABM positions payload validation failed',
      );
    }

    throw new HttpError(StatusCodes.BAD_GATEWAY, 'Impossible de charger les statistiques ABM pour le moment.', {
      code: 'ABM_BAD_RESPONSE',
      ...(env.isProduction ? {} : { payloadShape: summarizeParsedPayload(parsed) }),
    });
  }

  const items = externalItems.map((raw) => ({
    raw,
    normalized: mapExternalAbmPosition(raw),
  }));

  return buildAbmPositionsResponse({
    items,
    query,
    syncedAt: new Date().toISOString(),
  });
};

export const deleteAbmPosition = async (positionId: string): Promise<AbmPositionDeleteResult> => {
  const sessionManager = getAbmSessionManager();
  const sessionBefore = await sessionManager.getCookieDiagnostics();
  const upstreamPath = `${ABM_POSITION_DELETE_PATH_PREFIX}${encodeURIComponent(positionId)}`;

  if (!env.isProduction) {
    logger.info(
      {
        route: '/api/admin/abm/positions/:positionId',
        positionId,
        serviceReached: true,
        sameSessionManagerInstance: true,
        applicationCookiePresent: sessionBefore.applicationCookiePresent,
        sessionReused: sessionBefore.applicationCookiePresent,
        retryCount: 0,
        upstreamPath,
      },
      'ABM delete request',
    );
  }

  const response = await sessionManager.getProtectedTextDetailed(
    upstreamPath,
    {},
    {
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${env.ABM_BASE_URL}${ABM_POSITIONS_LIST_PATH}`,
      },
      maxRedirects: 0,
    },
  );

  const contentType = String(response.headers['content-type'] ?? '').toLowerCase();
  const body = String(response.data ?? '');
  const looksLikeLoginHtml = /input[^>]+__RequestVerificationToken/iu.test(body) && /input[^>]+UserName/iu.test(body);
  const responseCategory = looksLikeLoginHtml
    ? 'login_html'
    : contentType.includes('application/json')
      ? 'json'
      : /text\/html/iu.test(contentType) && response.status >= 500
        ? 'server_error'
        : /text\/html/iu.test(contentType)
          ? 'html'
          : response.status >= 300 && response.status < 400
            ? 'redirect'
            : 'unexpected';

  if (!env.isProduction) {
    logger.info(
      {
        route: '/api/admin/abm/positions/:positionId',
        positionId,
        upstreamPath,
        upstreamStatus: response.status,
        upstreamContentType: contentType,
        upstreamResponseCategory: responseCategory,
        loginHtmlReturned: looksLikeLoginHtml,
      },
      'ABM delete upstream response',
    );
  }

  if (looksLikeLoginHtml) {
    throw createAbmHttpError('ABM_SESSION_EXPIRED');
  }

  if (response.status >= 500) {
    throw createAbmHttpError('ABM_POSITION_DELETE_FAILED');
  }

  if (response.status >= 300 && response.status < 400) {
    throw createAbmHttpError('ABM_BAD_RESPONSE');
  }

  return normalizeDeleteResponse(body);
};
