// Lance Stocks (HTTP 3001 + gRPC 50051), Commandes (3000, sert aussi /demo/) et le worker de préparation en un seul terminal.
// Portable (pas de shell, pas de bash). DEV_WORKER=0 : ne pas lancer le worker (ex. si vous le démarrez à part avec npm run dev:worker).
// Les variables de votre environnement (et de .env) sont transmises. RabbitMQ/PostgreSQL : npm run infra:up (avant ou après).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import './lib/load-env.mjs';

const require = createRequire(import.meta.url);
const tsxCli = require.resolve('tsx/cli');
const root = fileURLToPath(new URL('..', import.meta.url));

const apps = [
  ['stocks', 'apps/stock-service/src/server.ts'],
  ['orders', 'apps/order-service/src/server.ts'],
];
if (process.env.DEV_WORKER !== '0') apps.push(['worker', 'apps/preparation-worker/src/server.ts']);

const children = apps.map(([name, entry]) => {
  const child = spawn(process.execPath, [tsxCli, 'watch', entry], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  const prefix = (stream, out) =>
    stream.on('data', (chunk) => {
      for (const line of String(chunk).split('\n')) if (line.trim()) out.write(`[${name}] ${line}\n`);
    });
  prefix(child.stdout, process.stdout);
  prefix(child.stderr, process.stderr);
  child.on('exit', (code) => {
    if (code) console.error(`[${name}] exited with code ${code}`);
  });
  return child;
});

function stop() {
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
