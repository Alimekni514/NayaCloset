import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { CSRF_COOKIE_NAME } from '../constants/auth';
import { HttpError } from '../lib/http-error';

export const requireCsrf = (req: Request, _res: Response, next: NextFunction): void => {
  const csrfCookie = req.cookies[CSRF_COOKIE_NAME] as string | undefined;
  const csrfHeader = req.header('x-csrf-token');

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    next(new HttpError(StatusCodes.FORBIDDEN, 'CSRF validation failed'));
    return;
  }

  next();
};
