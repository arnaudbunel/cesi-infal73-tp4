import { buildApp } from './app.js';
import { readOrderConfig, readRabbitUrl } from './config.js';
import { BrokerConnection } from './messaging/broker-connection.js';
import { RabbitPreparationPublisher } from './messaging/preparation-publisher.js';

const port = Number(process.env['PORT'] ?? 3000);
const host = process.env['HOST'] ?? '127.0.0.1';

let config;
let rabbitUrl: string;
try {
  config = readOrderConfig();
  rabbitUrl = readRabbitUrl();
} catch (error) {
  console.error(`[order-service] invalid configuration: ${(error as Error).message}`);
  process.exit(1);
}

// Mode laboratoire optionnel, refusé en production : LAB_MODE=1 npm run dev
// Il ajoute seulement un déclencheur de panne (en-tête X-Lab-Fault: throw), aucune route.
const labMode = process.env['LAB_MODE'] === '1';

// Connexion ouverte à la demande : Commandes démarre même si RabbitMQ est éteint (la route de préparation répond alors 503).
const broker = new BrokerConnection(rabbitUrl, (event, fields) => console.warn(JSON.stringify({ event, ...fields })));

const app = buildApp({
  logger: true,
  ...config,
  publisher: new RabbitPreparationPublisher(broker),
  labMode,
  ...(labMode && {
    lab: {
      onRequest: (request) => {
        if (request.headers['x-lab-fault'] === 'throw') {
          throw new Error('Simulated unexpected failure');
        }
      },
    },
  }),
});

try {
  await app.listen({ port, host });
  app.log.info(
    {
      stockBackend: config.stockBackend,
      stockBaseUrl: config.stockBaseUrl,
      stockGrpcTarget: config.stockGrpcTarget,
      stockGrpcDeadlineMs: config.stockGrpcDeadlineMs,
      demoTools: process.env['NODE_ENV'] !== 'production',
    },
    'order-service configuration',
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

async function shutdown(): Promise<void> {
  await app.close();
  await broker.close();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
