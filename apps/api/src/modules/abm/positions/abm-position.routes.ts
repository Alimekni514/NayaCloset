import { z } from 'zod';
import {
  abmPositionDetailParamsSchema,
  ABM_POSITIONS_SCHEMA_VERSION,
  abmPositionDeleteParamsSchema,
  abmPositionsQuerySchema,
  createAbmPositionRequestSchema,
} from '@delivery-commerce/shared';
import { Router } from 'express';

import { asyncHandler } from '../../../lib/async-handler';
import { validateRequest } from '../../../middleware/validate';
import { env } from '../../../config/env';

import {
  createAbmPositionController,
  getCitiesController,
  getDeliveryAddressBookController,
  getDeliveryAddressDetailController,
  getGovernoratesController,
  getLocalitiesController,
  getPickupAddressBookController,
  getPickupAddressDetailController,
  getPositionFormOptionsController,
  getPostalCodeController,
} from './abm-position.controller';
import {
  getAbmPositionDetailController,
  getAbmPositionLabelController,
  getAbmPositionLabelPdfController,
  getAbmPositionLabelPreviewController,
} from './abm-position-detail.controller';
import {
  ABM_POSITIONS_ROUTE_VERSION,
  getAbmPositionsController,
  deleteAbmPositionController,
} from './abm-position-list.controller';

const requiredQueryString = (field: string) =>
  z.object({
    [field]: z.string().trim().min(1),
  });

export const abmPositionRouter = Router();

abmPositionRouter.get(
  '/abm/positions/form-options',
  asyncHandler(async (req, res) => {
    await getPositionFormOptionsController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/positions/addresses/pickup',
  asyncHandler(async (req, res) => {
    await getPickupAddressBookController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/positions/addresses/delivery',
  asyncHandler(async (req, res) => {
    await getDeliveryAddressBookController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/positions/addresses/pickup/:id',
  validateRequest({ params: z.object({ id: z.string().trim().min(1) }) }),
  asyncHandler(async (req, res) => {
    await getPickupAddressDetailController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/positions/addresses/delivery/:id',
  validateRequest({ params: z.object({ id: z.string().trim().min(1) }) }),
  asyncHandler(async (req, res) => {
    await getDeliveryAddressDetailController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/locations/governorates',
  asyncHandler(async (req, res) => {
    await getGovernoratesController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/locations/cities',
  validateRequest({ query: requiredQueryString('governorateId') }),
  asyncHandler(async (req, res) => {
    await getCitiesController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/locations/localities',
  validateRequest({ query: requiredQueryString('cityId') }),
  asyncHandler(async (req, res) => {
    await getLocalitiesController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/locations/postal-code',
  validateRequest({ query: requiredQueryString('localityId') }),
  asyncHandler(async (req, res) => {
    await getPostalCodeController(req, res);
  }),
);

abmPositionRouter.post(
  '/abm/positions',
  validateRequest({ body: createAbmPositionRequestSchema }),
  asyncHandler(async (req, res) => {
    await createAbmPositionController(req, res);
  }),
);

if (!env.isProduction) {
  abmPositionRouter.get(
    '/abm/positions/query-check',
    validateRequest({ query: abmPositionsQuerySchema }),
    asyncHandler(async (_req, res) => {
      res.setHeader('X-Abm-Positions-Route-Version', ABM_POSITIONS_ROUTE_VERSION);
      res.setHeader('X-Abm-Positions-Schema-Version', ABM_POSITIONS_SCHEMA_VERSION);
      res.setHeader('X-Debug-Controller', 'query-check');

      res.status(200).json({
        ok: true,
        parsedQuery: res.locals.validatedQuery,
        schemaVersion: ABM_POSITIONS_SCHEMA_VERSION,
        routeVersion: ABM_POSITIONS_ROUTE_VERSION,
      });
    }),
  );
}

abmPositionRouter.get(
  '/abm/positions',
  validateRequest({ query: abmPositionsQuerySchema }),
  asyncHandler(async (req, res) => {
    await getAbmPositionsController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId',
  validateRequest({ params: abmPositionDetailParamsSchema }),
  asyncHandler(async (req, res) => {
    await getAbmPositionDetailController(req, res);
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId/label/normal',
  validateRequest({ params: abmPositionDetailParamsSchema }),
  asyncHandler(async (req, res) => {
    await getAbmPositionLabelController(req, res, 'normal');
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId/label/zebra',
  validateRequest({ params: abmPositionDetailParamsSchema }),
  asyncHandler(async (req, res) => {
    await getAbmPositionLabelController(req, res, 'zebra');
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId/labels/normal/preview',
  validateRequest({ params: abmPositionDetailParamsSchema }),
  asyncHandler(async (req, res) => {
    await getAbmPositionLabelPreviewController(req, res, 'normal');
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId/labels/zebra/preview',
  validateRequest({ params: abmPositionDetailParamsSchema }),
  asyncHandler(async (req, res) => {
    await getAbmPositionLabelPreviewController(req, res, 'zebra');
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId/labels/normal/pdf',
  validateRequest({ params: abmPositionDetailParamsSchema, query: z.object({ disposition: z.enum(['inline', 'attachment']).optional() }) }),
  asyncHandler(async (req, res) => {
    await getAbmPositionLabelPdfController(req, res, 'normal');
  }),
);

abmPositionRouter.get(
  '/abm/positions/:positionId/labels/zebra/pdf',
  validateRequest({ params: abmPositionDetailParamsSchema, query: z.object({ disposition: z.enum(['inline', 'attachment']).optional() }) }),
  asyncHandler(async (req, res) => {
    await getAbmPositionLabelPdfController(req, res, 'zebra');
  }),
);

abmPositionRouter.delete(
  '/abm/positions/:positionId',
  validateRequest({ params: abmPositionDeleteParamsSchema }),
  asyncHandler(async (req, res) => {
    await deleteAbmPositionController(req, res);
  }),
);
