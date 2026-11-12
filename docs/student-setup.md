# Mise en route TP4 (≈ 8 min)

1. `node -v` → v24.x (`nvm use` sous Linux/macOS ; Node 24 LTS sous Windows).
2. `docker info` doit répondre sans erreur. « permission denied » (Linux) : groupe `docker` puis reconnexion ; « cannot connect » : démarrez Docker Desktop / le service.
3. Installation et infrastructure :
   - Bash : `npm ci && npm run infra:up`
   - PowerShell : `npm ci; npm run infra:up`
   `infra:up` attend les health checks de RabbitMQ et PostgreSQL, applique la topologie puis les migrations. Si un port est occupé, changez `RABBITMQ_AMQP_PORT`, `RABBITMQ_MGMT_PORT` ou `POSTGRES_PORT` dans `.env` (copie de `.env.example`).
4. `npm test` : **entièrement vert**.
5. `npm run dev` (Stocks + Commandes + worker). Interface : <http://127.0.0.1:3000/demo/> · RabbitMQ : <http://127.0.0.1:15672> (utilisateur/mot de passe : voir `.env.example`).
6. `npm run test:acceptance:tp4` (arrêtez d'abord `npm run dev`) : **notez ce qui échoue avant de modifier quoi que ce soit** — c'est attendu.

## Variables utiles — une ligne
| But | Bash | PowerShell |
|---|---|---|
| Worker nommé | `WORKER_NAME=worker-a npm run dev:worker` | `$env:WORKER_NAME="worker-a"; npm run dev:worker` |
| Crash après COMMIT (T3) | `FAULT=EXIT_AFTER_COMMIT_BEFORE_ACK npm run dev:worker` | `$env:FAULT="EXIT_AFTER_COMMIT_BEFORE_ACK"; npm run dev:worker` |
| Dépendance 503 pendant 5 s (T4) | `npm run lab:dependency-down -- --ms 5000` | idem |
| Lancer sans le worker | `DEV_WORKER=0 npm run dev` | `$env:DEV_WORKER="0"; npm run dev` |
| Commandes en gRPC (TP3) | `STOCK_BACKEND=grpc npm run dev` | `$env:STOCK_BACKEND="grpc"; npm run dev` |

PowerShell : les variables persistent dans la fenêtre ; nettoyez-les avec `Remove-Item Env:FAULT, Env:WORKER_NAME, Env:DEV_WORKER -ErrorAction SilentlyContinue`.

## Relever l'état pour vos fiches
- `npm run lab:state` : *ready / unacked / consumers* des 5 queues + contenu de `prepared_orders` et `processed_operations`.
- SQL direct : `docker compose exec postgres psql -U lab -d infal73_tp4_lab -c "SELECT * FROM prepared_orders"`.
- Logs : une ligne JSON par événement, horodatée (`delivery.received` fourni ; à vous d'ajouter « opération terminée », « retry planifié »…).

## Identités de démonstration (TP3)
Alice possède ORD-101, ORD-102 et ORD-103 ; Bob possède ORD-104. `ORD-104` (CANCELLED) et `ORD-103` (SHIPPED) ne peuvent pas être préparées (409) ; utilisez `ORD-101` ou `ORD-102`.

## Reset
Voir le README : `npm run reset` (ciblé), `npm run reset -- --topology`, `npm run infra:down`, `npm run infra:destroy`.

## Premier diagnostic (phase A)
Dans le Management : quels exchanges, queues, bindings existent ? Combien de consommateurs sur `orders.prepare` quand le worker tourne ? Que devient un message publié quand aucun worker n'est lancé ? Écrivez vos prédictions **avant** d'expérimenter.
