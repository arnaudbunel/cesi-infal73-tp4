// Configuration de LABORATOIRE partagée par les scripts (valeurs factices, 127.0.0.1). Refuse NODE_ENV=production.
import { fileURLToPath } from 'node:url';
import './load-env.mjs';

if (process.env.NODE_ENV === 'production') {
  console.error('Refus : les scripts de laboratoire (infra, reset, injections de panne) sont interdits si NODE_ENV=production.');
  process.exit(1);
}

const env = process.env;
export const lab = {
  rabbitUser: env.RABBITMQ_USER ?? 'lab',
  rabbitPassword: env.RABBITMQ_PASSWORD ?? 'lab-only-change-me',
  amqpPort: Number(env.RABBITMQ_AMQP_PORT ?? 5672),
  mgmtPort: Number(env.RABBITMQ_MGMT_PORT ?? 15672),
  pgUser: env.POSTGRES_USER ?? 'lab',
  pgPassword: env.POSTGRES_PASSWORD ?? 'lab-only-change-me',
  pgPort: Number(env.POSTGRES_PORT ?? 55432),
  pgDatabase: env.POSTGRES_DB ?? 'infal73_tp4_lab',
  mgmtUrl: `http://127.0.0.1:${Number(env.RABBITMQ_MGMT_PORT ?? 15672)}`,
  databaseUrl:
    env.DATABASE_URL ??
    `postgres://${env.POSTGRES_USER ?? 'lab'}:${encodeURIComponent(env.POSTGRES_PASSWORD ?? 'lab-only-change-me')}@127.0.0.1:${Number(env.POSTGRES_PORT ?? 55432)}/${env.POSTGRES_DB ?? 'infal73_tp4_lab'}`,
  stateDir: env.LAB_STATE_DIR ?? fileURLToPath(new URL('../../.lab-state', import.meta.url)),
};

/** Files réellement touchées par un nettoyage ciblé (jamais d'autres queues du broker). */
export const LAB_QUEUES = ['orders.prepare', 'orders.retry.2s', 'orders.retry.5s', 'orders.retry.10s', 'orders.prepare.dlq'];
export const LAB_TABLES = ['processed_operations', 'prepared_orders'];
