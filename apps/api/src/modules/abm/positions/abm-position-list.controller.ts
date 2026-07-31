import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ABM_POSITIONS_SCHEMA_VERSION } from '@delivery-commerce/shared';

import { logger } from '../../../config/logger';
import { env } from '../../../config/env';

import { deleteAbmPosition, getAbmPositions } from './abm-position-list.service';

export const ABM_POSITIONS_ROUTE_VERSION = '2026-07-29-date-only-v3';

export const getAbmPositionsController = async (req: Request, res: Response) => {
  res.setHeader('X-Abm-Positions-Route-Version', ABM_POSITIONS_ROUTE_VERSION);
  if (!env.isProduction) {
    res.setHeader('X-Abm-Positions-Schema-Version', ABM_POSITIONS_SCHEMA_VERSION);
  }

  const query = res.locals.validatedQuery || req.query;
  if (!env.isProduction) {
    logger.info(
      {
        route: '/api/admin/abm/positions',
        receivedQuery: query,
        validationSuccess: true,
        controllerReached: true,
      },
      'ABM positions list controller reached',
    );
  }
  const positions = await getAbmPositions(query as any);
  res.status(StatusCodes.OK).json(positions);
};

export const deleteAbmPositionController = async (req: Request, res: Response) => {
  const result = await deleteAbmPosition(String(req.params.positionId));
  res.status(StatusCodes.OK).json({
    result,
    message: 'Position supprimee avec succes.',
  });
};
