import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { asyncHandler } from '../../lib/async-handler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  approveAdminOrder,
  declineAdminOrder,
  getAdminOrderDetail,
  listAdminOrders,
} from '../../modules/orders/admin-order.service';
import {
  adminOrderIdParamsSchema,
  adminOrdersListQuerySchema,
  declineOrderRequestSchema,
} from '../orders/orders.schemas';

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

adminOrdersRouter.get(
  '/orders',
  validateRequest({ query: adminOrdersListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listAdminOrders(res.locals.validatedQuery ?? req.query);
    res.status(StatusCodes.OK).json(result);
  }),
);

adminOrdersRouter.get(
  '/orders/:orderId',
  validateRequest({ params: adminOrderIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const result = await getAdminOrderDetail(orderId);
    res.status(StatusCodes.OK).json(result);
  }),
);

adminOrdersRouter.post(
  '/orders/:orderId/approve',
  validateRequest({ params: adminOrderIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const result = await approveAdminOrder({
      orderId,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
    });
    res.status(StatusCodes.OK).json(result);
  }),
);

adminOrdersRouter.post(
  '/orders/:orderId/decline',
  validateRequest({ params: adminOrderIdParamsSchema, body: declineOrderRequestSchema }),
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const result = await declineAdminOrder({
      orderId,
      reason: req.body.reason,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
    });
    res.status(StatusCodes.OK).json(result);
  }),
);

adminOrdersRouter.post(
  '/orders/:orderId/retry-abm',
  validateRequest({ params: adminOrderIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId);
    const result = await approveAdminOrder({
      orderId,
      actorUserId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
    });
    res.status(StatusCodes.OK).json(result);
  }),
);
