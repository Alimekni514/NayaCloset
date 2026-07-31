import mongoose from 'mongoose';

import { env } from '../config/env';
import { logger } from '../config/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

// Attach Mongoose connection lifecycle events (URI never logged).
mongoose.connection.on('connected', () => {
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err: Error) => {
  // Log error name/message only – never log the URI.
  logger.error({ errName: err.name, errMessage: err.message }, 'MongoDB connection error');
});

export const connectToDatabase = async (uri = env.MONGODB_URI): Promise<void> => {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {
        // Atlas recommended settings
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      return;
    } catch (err) {
      attempt += 1;
      const isLastAttempt = attempt >= MAX_RETRIES;

      logger.error(
        {
          attempt,
          maxRetries: MAX_RETRIES,
          errName: err instanceof Error ? err.name : 'UnknownError',
          errMessage: err instanceof Error ? err.message : String(err),
        },
        isLastAttempt
          ? 'MongoDB connection failed after all retries'
          : `MongoDB connection attempt ${attempt} failed – retrying in ${RETRY_DELAY_MS}ms`,
      );

      if (isLastAttempt) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
};

/**
 * Register OS signal handlers for graceful shutdown.
 * Call once during server startup.
 */
export const registerGracefulShutdown = (server: { close: (cb?: () => void) => void }): void => {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received – closing server and database');

    server.close(async () => {
      try {
        await disconnectFromDatabase();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out – forcing exit');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};
