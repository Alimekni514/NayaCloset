import {
  abmPositionDetailParamsSchema,
  abmPositionDetailResponseSchema,
  type AbmPositionDetail,
} from '@delivery-commerce/shared';

import { createAbmHttpError } from '../abm.errors';
import { getAbmSessionManager } from '../index';

import { parseAbmPositionDetailHtml } from './abm-position-detail.parser';

const ABM_POSITION_DETAIL_PATH_PREFIX = '/cPosition/position_details/';
const isHtmlLogin = (body: string): boolean =>
  /__RequestVerificationToken/iu.test(body) && /UserName/iu.test(body);

export const getAbmPositionDetail = async (positionId: string): Promise<AbmPositionDetail> => {
  const parsedParams = abmPositionDetailParamsSchema.safeParse({ positionId });
  if (!parsedParams.success) {
    throw createAbmHttpError('ABM_INVALID_POSITION_ID');
  }

  const sessionManager = getAbmSessionManager();
  const path = `${ABM_POSITION_DETAIL_PATH_PREFIX}${encodeURIComponent(positionId)}`;
  const response = await sessionManager.getProtectedTextDetailed(path);
  const contentType = String(response.headers['content-type'] ?? '').toLowerCase();

  if (contentType.includes('text/html') && isHtmlLogin(response.data)) {
    throw createAbmHttpError('ABM_SESSION_EXPIRED');
  }

  const detail = parseAbmPositionDetailHtml(response.data, parsedParams.data.positionId);
  return abmPositionDetailResponseSchema.parse({ position: detail }).position;
};
