import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { logger } from '../config/logger';
import { HttpError } from '../lib/http-error';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = res.getHeader('x-request-id');

  if (error instanceof ZodError || (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError')) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      issues: (error as any).flatten ? (error as any).flatten() : error,
      requestId,
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
      requestId,
      details: error.details,
    });
    return;
  }

  if (error instanceof mongoose.Error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Database request failed',
      requestId,
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    res.status(StatusCodes.CONFLICT).json({
      message: 'Email is already registered',
      requestId,
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status === StatusCodes.BAD_REQUEST
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Invalid JSON body',
      requestId,
    });
    return;
  }

  logger.error({ err: error, path: req.path }, 'Unhandled request error');

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error',
    requestId,
  });
};
