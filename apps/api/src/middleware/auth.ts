import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@delivery-commerce/shared';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { HttpError } from '../lib/http-error';
import { UserModel } from '../models/user.model';
import type { AuthUser } from '../types/express';

type AccessPayload = AuthUser & { type: 'access' };

const resolveUserFromToken = async (token: string): Promise<AuthUser | null> => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    const user = await UserModel.findById(decoded.id).select('email role isActive').lean();

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      ...(decoded.sessionId ? { sessionId: decoded.sessionId } : {}),
    };
  } catch {
    return null;
  }
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.dc_access_token as string | undefined;

  if (!token) {
    next(new HttpError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    return;
  }

  const user = await resolveUserFromToken(token);

  if (!user) {
    next(new HttpError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    return;
  }

  req.user = user;
  next();
};

export const attachOptionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.dc_access_token as string | undefined;

  if (!token) {
    next();
    return;
  }

  const user = await resolveUserFromToken(token);

  if (user) {
    req.user = user;
  }

  next();
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(StatusCodes.FORBIDDEN, 'Forbidden'));
      return;
    }

    next();
  };
