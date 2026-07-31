import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env';
import { logger } from './config/logger';
import { requestIdMiddleware } from './lib/request-id';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { abmRouter } from './modules/abm';
import { adminOrdersRouter } from './routes/admin/admin-orders.route';
import { authRouter } from './routes/auth/auth.route';
import { healthRouter } from './routes/health.route';
import { ordersRouter } from './routes/orders/orders.route';
import { productsRouter } from './routes/products/products.route';

export const app = express();

app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'];

      if (typeof existing === 'string') {
        return existing;
      }

      return res.getHeader('x-request-id')?.toString() ?? 'unknown-request-id';
    },
  }),
);
app.use(
  cors({
    origin: [env.WEB_ORIGIN],
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminOrdersRouter);
app.use('/api/admin', abmRouter);

app.use(notFoundHandler);
app.use(errorHandler);
