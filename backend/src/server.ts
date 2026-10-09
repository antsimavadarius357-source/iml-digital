import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './database/prisma';
import { logger } from './utils/logger';

const server = createApp().listen(env.PORT, () => {
  logger.info(`API IML DIGITAL démarrée sur le port ${env.PORT}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
