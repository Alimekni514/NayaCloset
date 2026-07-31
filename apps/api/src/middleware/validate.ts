import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

import { sanitizePayload } from '../lib/sanitize';

type Schemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validateRequest =
  ({ body, params, query }: Schemas) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (body) {
      req.body = sanitizePayload(body.parse(req.body));
    }

    if (params) {
      req.params = sanitizePayload(params.parse(req.params)) as Request['params'];
    }

    if (query) {
      const parseResult = query.safeParse(req.query);
      if (!parseResult.success) {
        next(parseResult.error);
        return;
      }

      res.locals.validatedQuery = sanitizePayload(parseResult.data);
    }

    next();
  };
