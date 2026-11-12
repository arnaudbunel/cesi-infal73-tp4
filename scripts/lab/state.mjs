// Relevé d'état pour vos fiches de test : compteurs ready/unacked/consumers des 5 queues + contenu des tables SQL.
// Usage : node scripts/lab/state.mjs   (aussi : npm run lab:state)
import pg from 'pg';
import { LAB_QUEUES, lab } from '../lib/lab-config.mjs';
import { queueStats } from '../lib/mgmt.mjs';

console.log(`# ${new Date().toISOString()}`);
for (const name of LAB_QUEUES) {
  try {
    const s = await queueStats(name);
    console.log(`${name.padEnd(20)} ready=${s.ready} unacked=${s.unacked} consumers=${s.consumers}`);
  } catch (error) {
    console.log(`${name.padEnd(20)} indisponible (${error.message.split('\n')[0]})`);
  }
}
const client = new pg.Client({ connectionString: lab.databaseUrl });
try {
  await client.connect();
  console.table((await client.query('SELECT order_id, operation_id, prepared_at FROM prepared_orders ORDER BY prepared_at')).rows);
  console.table((await client.query('SELECT consumer_name, operation_id, processed_at FROM processed_operations ORDER BY processed_at')).rows);
} catch (error) {
  console.log(`PostgreSQL indisponible : ${error.message.split('\n')[0]}`);
} finally {
  await client.end().catch(() => undefined);
}
