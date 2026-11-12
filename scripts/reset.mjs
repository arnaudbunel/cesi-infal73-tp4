// Remise à zéro CIBLÉE du laboratoire. Ne touche à rien d'étranger :
//   - supprime les dist/ du dépôt ;
//   - vide uniquement les 5 queues du TP4 (orders.prepare, orders.retry.*, orders.prepare.dlq) ;
//   - vide uniquement les tables processed_operations et prepared_orders de la base du laboratoire ;
//   - supprime l'état d'injection de panne local (.lab-state/) ;
//   - signale les ports occupés.
// Options : --topology  supprime puis recrée les 5 queues du TP4 (utile si leurs arguments ont été modifiés).
import { rmSync } from 'node:fs';
import { createConnection } from 'node:net';
import pg from 'pg';
import { LAB_QUEUES, LAB_TABLES, lab } from './lib/lab-config.mjs';
import { mgmt, mgmtReachable, purgeQueue, queueName } from './lib/mgmt.mjs';
import { applyTopology } from './topology.mjs';

for (const dir of ['apps/order-service/dist', 'apps/stock-service/dist', 'apps/preparation-worker/dist']) {
  rmSync(new URL(`../${dir}`, import.meta.url), { recursive: true, force: true });
  console.log(`removed ${dir}`);
}
rmSync(lab.stateDir, { recursive: true, force: true });
console.log('removed .lab-state (injections de panne)');

if (await mgmtReachable()) {
  if (process.argv.includes('--topology')) {
    for (const name of LAB_QUEUES) await mgmt('DELETE', `/queues/%2F/${queueName(name)}`);
    await applyTopology();
  } else {
    for (const name of LAB_QUEUES) {
      try {
        await purgeQueue(name);
        console.log(`queue vidée : ${name}`);
      } catch (error) {
        console.log(`queue ${name} non vidée (${error.message.split('\n')[0]}) — topologie absente ? npm run infra:topology`);
      }
    }
  }
} else {
  console.log(`RabbitMQ Management injoignable (${lab.mgmtUrl}) : queues non vidées (npm run infra:up).`);
}

if (!/_lab$/.test(lab.pgDatabase)) {
  console.log(`base « ${lab.pgDatabase} » : refus de vider (le nom doit se terminer par _lab).`);
} else {
  const client = new pg.Client({ connectionString: lab.databaseUrl });
  try {
    await client.connect();
    await client.query(`TRUNCATE TABLE ${LAB_TABLES.join(', ')}`);
    console.log(`tables vidées : ${LAB_TABLES.join(', ')}`);
  } catch (error) {
    console.log(`PostgreSQL non réinitialisé (${error.message.split('\n')[0]}) — npm run infra:up puis npm run db:migrate.`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

const inUse = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('error', () => resolve(false));
  });

for (const [label, port] of [['Commandes', 3000], ['Stocks HTTP', 3001], ['Stocks gRPC', 50051]]) {
  console.log(`port ${port} (${label}): ${(await inUse(port)) ? 'OCCUPÉ - arrêtez le processus (Ctrl+C) puis relancez npm run dev' : 'libre'}`);
}
