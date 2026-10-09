import pino from 'pino';
import { env, isProduction } from '../config/env';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  // Aucune donnée sensible dans les journaux.
  redact: ['req.headers.authorization', 'req.headers.cookie', 'password', '*.password', '*.passwordHash'],
  enabled: env.NODE_ENV !== 'test',
});
