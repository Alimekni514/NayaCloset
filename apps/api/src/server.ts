import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectToDatabase } from './db/connect';

// Render injects PORT at runtime; fall back to the configured API_PORT for local dev.
const port = Number(process.env['PORT'] ?? env.API_PORT);
// Bind to 0.0.0.0 so Render (and other PaaS) can reach the process.
const host = '0.0.0.0';

const start = async (): Promise<void> => {
  if (!env.isProduction) {
    logger.info(
      {
        abmBaseUrlConfigured: env.diagnostics.abmBaseUrlConfigured,
        abmUsernameConfigured: env.diagnostics.abmUsernameConfigured,
        abmPasswordConfigured: env.diagnostics.abmPasswordConfigured,
        abmTimeoutConfigured: env.diagnostics.abmTimeoutConfigured,
        cwd: env.diagnostics.cwd,
      },
      'Startup environment diagnostics',
    );
  }

  await connectToDatabase();
  app.listen(port, host, () => {
    logger.info({ port, host }, 'API server listening');
  });
};

void start();
