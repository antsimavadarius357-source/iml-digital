import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './database/prisma';
import { logger } from './utils/logger';
import { initAppointmentReminderScheduler } from './modules/appointments/appointments-reminder.service';

// S'assurer que le dossier uploads existe au démarrage (requis pour Render / Linux)
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const server = createApp().listen(env.PORT, () => {
  logger.info(`API IML DIGITAL démarrée sur le port ${env.PORT}`);
  initAppointmentReminderScheduler();
});

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
