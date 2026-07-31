import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: res.getHeader('x-request-id'),
  });
};
