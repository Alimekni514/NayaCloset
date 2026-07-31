import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { abmDashboardQuerySchema } from '@delivery-commerce/shared';

import { getAbmDashboardController } from './abm.dashboard.controller';
import { abmPositionRouter } from './positions/abm-position.routes';

export const abmRouter = Router();

abmRouter.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

abmRouter.get(
  '/abm/dashboard',
  validateRequest({ query: abmDashboardQuerySchema }),
  asyncHandler(async (req, res) => {
    await getAbmDashboardController(req, res);
  }),
);

abmRouter.use(abmPositionRouter);
