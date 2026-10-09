/**
 * Base PostgreSQL LOCALE de développement (sans Docker, quelques dizaines de Mo de RAM).
 * Lancement : npm run dev:db   (laisser tourner ; Ctrl+C pour arrêter)
 * Données stockées dans backend/.pgdata (ignoré par git). Jamais utilisée en production.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(__dirname, '..', '.pgdata');
const port = Number(process.env.DEV_DB_PORT ?? 5433);

async function main(): Promise<void> {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'iml_dev',
    password: 'iml_dev_local',
    port,
    persistent: true,
  });
  const fresh = !existsSync(path.join(dataDir, 'PG_VERSION'));
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase('iml_digital');
  console.log(`PostgreSQL local prêt sur le port ${port} (base iml_digital).`);

  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
