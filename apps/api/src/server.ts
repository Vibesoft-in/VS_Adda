import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { Scheduler } from './jobs/scheduler.js';
import { Worker } from './jobs/worker.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 VS Adda API server running on ${env.API_URL} (Port ${env.PORT}) [${env.NODE_ENV}]`);
});

// Start Background Scheduler & Worker loops
let isShuttingDown = false;

const runSchedulerLoop = async () => {
  while (!isShuttingDown) {
    try {
      await Scheduler.tick();
    } catch (err: any) {
      logger.error({ err: err.message }, 'Scheduler tick error');
    }
    await new Promise((r) => setTimeout(r, 15000)); // Every 15 seconds
  }
};

const runWorkerLoop = async () => {
  while (!isShuttingDown) {
    try {
      const processedCount = await Worker.runBatch();
      if (processedCount === 0) {
        await new Promise((r) => setTimeout(r, 4000)); // Sleep when queue empty
      }
    } catch (err: any) {
      logger.error({ err: err.message }, 'Worker loop error');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

runSchedulerLoop();
runWorkerLoop();

const shutdown = (signal: string) => {
  isShuttingDown = true;
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
