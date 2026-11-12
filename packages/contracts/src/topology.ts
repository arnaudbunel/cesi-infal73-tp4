/**
 * Noms et paramètres publics de la topologie RabbitMQ du TP4.
 * La déclaration effective est dans `docker/rabbitmq/definitions.json` (appliquée par `npm run infra:topology`).
 */
export const EXCHANGES = {
  commands: 'orders.commands',
  retry: 'orders.retry',
  dead: 'orders.dead',
} as const;

export const QUEUES = {
  prepare: 'orders.prepare',
  retry2s: 'orders.retry.2s',
  retry5s: 'orders.retry.5s',
  retry10s: 'orders.retry.10s',
  dlq: 'orders.prepare.dlq',
} as const;

export const ROUTING_KEYS = {
  prepare: 'order.prepare',
  failed: 'order.failed',
  retry1: 'retry.1',
  retry2: 'retry.2',
  retry3: 'retry.3',
} as const;

/** TTL (ms) de chaque queue de retry. Ce sont des délais minimaux, pas des échéances garanties. */
export const RETRY_TTL_MS = {
  [QUEUES.retry2s]: 2_000,
  [QUEUES.retry5s]: 5_000,
  [QUEUES.retry10s]: 10_000,
} as const;

/** Nombre maximal de nouvelles tentatives : `attempt` vaut 0 puis au plus 3. */
export const MAX_RETRIES = 3;

/** Prefetch du consommateur de préparation. */
export const WORKER_PREFETCH = 2;

/** Identité du consommateur dans `processed_operations.consumer_name`. */
export const WORKER_CONSUMER_NAME = 'preparation-worker';
