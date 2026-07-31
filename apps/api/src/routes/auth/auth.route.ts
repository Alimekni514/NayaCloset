import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { REFRESH_COOKIE_NAME } from '../../constants/auth';
import { authRateLimit } from '../../config/rate-limit';
import { asyncHandler } from '../../lib/async-handler';
import { HttpError } from '../../lib/http-error';
import { requireAuth } from '../../middleware/auth';
import { requireCsrf } from '../../middleware/csrf';
import { validateRequest } from '../../middleware/validate';
import { UserModel } from '../../models/user.model';
import {
  authenticateUser,
  clearAuthCookies,
  refreshSession,
  registerUser,
  revokeAllSessions,
  revokeSession,
} from '../../services/auth.service';
import { writeAuditLog } from '../../services/audit.service';
import { toUserDto } from '../../utils/mappers';
import { loginSchema, registerSchema } from './auth.schemas';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimit,
  validateRequest({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const user = await registerUser(req.body);
    res.status(StatusCodes.CREATED).json({ user });
  }),
);

authRouter.post(
  '/login',
  authRateLimit,
  validateRequest({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const user = await authenticateUser({
      ...req.body,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      res,
    });
    res.status(StatusCodes.OK).json({ user });
  }),
);

authRouter.post(
  '/refresh',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!refreshToken) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid session');
    }

    const user = await refreshSession({
      refreshToken,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
      res,
    });
    res.status(StatusCodes.OK).json({ user });
  }),
);

authRouter.post(
  '/logout',
  requireCsrf,
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user?.sessionId) {
      await revokeSession(req.user.sessionId);
      await writeAuditLog({
        action: 'auth.logout',
        entityType: 'RefreshSession',
        entityId: req.user.sessionId,
        actor: {
          email: req.user.email,
          role: req.user.role,
        },
      });
    }

    clearAuthCookies(res);
    res.status(StatusCodes.OK).json({ message: 'Logged out' });
  }),
);

authRouter.post(
  '/logout-all',
  requireCsrf,
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeAllSessions(req.user!.id);
    await writeAuditLog({
      action: 'auth.logout_all',
      entityType: 'User',
      entityId: req.user!.id,
      actor: {
        email: req.user!.email,
        role: req.user!.role,
      },
    });
    clearAuthCookies(res);
    res.status(StatusCodes.OK).json({ message: 'Logged out from all sessions' });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).lean();

    if (!user) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'User not found');
    }

    res.status(StatusCodes.OK).json({ user: toUserDto(user) });
  }),
);
