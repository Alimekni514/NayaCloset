import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { guestOrderRateLimit } from '../../config/rate-limit';
import { asyncHandler } from '../../lib/async-handler';
import { HttpError } from '../../lib/http-error';
import { attachOptionalAuth, requireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { getCities, getGovernorates, getLocalities, getPostalCode } from '../../modules/abm/positions/abm-position.service';
import { createGuestOrder } from '../../modules/orders/guest-order.service';
import { toGuestOrderResponseDto } from '../../modules/orders/order-http.mapper';
import { OrderModel } from '../../models/order.model';

import { adminOrderIdParamsSchema, guestOrderCreateRequestSchema } from './orders.schemas';

export const ordersRouter = Router();

ordersRouter.post(
  '/guest',
  guestOrderRateLimit,
  attachOptionalAuth,
  validateRequest({ body: guestOrderCreateRequestSchema }),
  asyncHandler(async (req, res) => {
    const order = await createGuestOrder({
      ...(req.user ? { userId: req.user.id } : {}),
      ...(typeof req.header('idempotency-key') === 'string'
        ? { idempotencyKey: req.header('idempotency-key') as string }
        : {}),
      items: req.body.items,
      delivery: req.body.delivery,
    });

    res.status(StatusCodes.CREATED).json(toGuestOrderResponseDto(order));
  }),
);

const requiredQueryString = (field: string) =>
  z.object({
    [field]: z.string().trim().min(1),
  });

ordersRouter.get(
  '/locations/governorates',
  asyncHandler(async (_req, res) => {
    const governorates = await getGovernorates();
    res.status(StatusCodes.OK).json({ governorates });
  }),
);

ordersRouter.get(
  '/locations/cities',
  validateRequest({ query: requiredQueryString('governorateId') }),
  asyncHandler(async (req, res) => {
    const cities = await getCities(String(req.query.governorateId));
    res.status(StatusCodes.OK).json({ cities });
  }),
);

ordersRouter.get(
  '/locations/localities',
  validateRequest({ query: requiredQueryString('cityId') }),
  asyncHandler(async (req, res) => {
    const localities = await getLocalities(String(req.query.cityId));
    res.status(StatusCodes.OK).json({ localities });
  }),
);

ordersRouter.get(
  '/locations/postal-code',
  validateRequest({ query: requiredQueryString('localityId') }),
  asyncHandler(async (req, res) => {
    const postalCode = await getPostalCode(String(req.query.localityId));
    res.status(StatusCodes.OK).json(postalCode);
  }),
);

ordersRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await OrderModel.find({ 'customer.userId': req.user!.id }).sort({ createdAt: -1 }).lean();
    res.status(StatusCodes.OK).json({
      items: orders.map((order) => ({
        id: order._id.toString(),
        reference: order.reference,
        status: order.status,
        totalMillimes: order.totalMillimes,
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  }),
);

ordersRouter.get(
  '/:orderId',
  requireAuth,
  validateRequest({ params: adminOrderIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const order = await OrderModel.findById(req.params.orderId).lean();

    if (!order) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Commande introuvable.');
    }

    if (order.customer?.userId?.toString() !== req.user!.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Forbidden');
    }

    res.status(StatusCodes.OK).json({
      order: {
        id: order._id.toString(),
        reference: order.reference,
        status: order.status,
        totalMillimes: order.totalMillimes,
        currency: order.currency,
      },
    });
  }),
);
