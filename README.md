# INFAL73 — Partie 5 — TP4 : messagerie RabbitMQ et gestion des pannes

Master 1 MAALSI · groupes de 2 à 4 · **80 min**. Suite des TP1–TP3 : API Commandes (REST), Stocks (HTTP + gRPC), suivi WebSocket.
Mission : confier la **préparation d'une commande** à un worker asynchrone (RabbitMQ + PostgreSQL) qui reprend après une panne **sans préparer deux fois** la même commande.
Tout reste sur `127.0.0.1`, avec des identifiants factices de laboratoire. Aucun compte, cloud ni service payant.

## Prérequis
Node.js 24 (`nvm use` lit `.nvmrc`), npm ≥ 10, **Docker avec Compose v2** accessible à votre utilisateur (RabbitMQ et PostgreSQL tournent en conteneurs).
Si `docker info` répond « permission denied » (Linux) : ajoutez-vous au groupe `docker`, puis reconnectez-vous.

## Démarrage (ordre de lancement)
| Étape | Bash | PowerShell (une ligne) |
|---|---|---|
| 1. Dépendances | `npm ci` | `npm ci` |
| 2. Infrastructure (RabbitMQ, PostgreSQL, topologie, migrations) | `npm run infra:up` | `npm run infra:up` |
| 3. Tests de fonctionnement (doivent être **verts**) | `npm test` | `npm test` |
| 4. Plateforme + worker (un terminal) | `npm run dev` | `npm run dev` |
| 4 bis. Worker seul, nommé (autre terminal) | `WORKER_NAME=worker-a npm run dev:worker` | `$env:WORKER_NAME="worker-a"; npm run dev:worker` |
| 5. Tests T1–T7 (**des échecs sont attendus**) | `npm run test:acceptance:tp4` | `npm run test:acceptance:tp4` |

`npm run dev` lance Stocks (3001 HTTP, 50051 gRPC), Commandes (3000) et le worker. `DEV_WORKER=0 npm run dev` (PowerShell : `$env:DEV_WORKER="0"; npm run dev`) lance sans worker.
**Avant `npm run test:acceptance:tp4`, arrêtez `npm run dev`** : un worker déjà actif consommerait les messages des tests (les tests le détectent et refusent de démarrer).
Si Docker n'est pas démarré, `npm run infra:up` l'explique ; les tests d'infrastructure échouent avec l'action à faire.

Test rapide de la route (après `npm run dev`) :
- Bash : `curl -i -X POST http://127.0.0.1:3000/api/orders/ORD-102/preparation`
- PowerShell : `curl.exe -i -X POST http://127.0.0.1:3000/api/orders/ORD-102/preparation`

Au départ la réponse est **501** (publication non complétée) : c'est le travail de la phase B.

## Ports (tous liés à 127.0.0.1, paramétrables par `.env` ou variables d'environnement)
| Service | Port | Variable |
|---|---|---|
| Commandes (REST + WebSocket + `/demo/`) | 3000 | `PORT`, `HOST` |
| Stocks HTTP / gRPC | 3001 / 50051 | `STOCK_PORT`, `GRPC_STOCK_PORT` |
| RabbitMQ AMQP | 5672 | `RABBITMQ_AMQP_PORT` |
| RabbitMQ Management | 15672 | `RABBITMQ_MGMT_PORT` |
| PostgreSQL (hôte) | **55432** (≠ 5432, pour éviter un conflit) | `POSTGRES_PORT` |

Copiez `.env.example` vers `.env` pour changer une valeur (lu par Compose, les scripts npm, `npm run dev` et les tests).

## Vérifier RabbitMQ Management
Ouvrez <http://127.0.0.1:15672> (utilisateur `lab`, mot de passe de `.env.example`) → onglets **Exchanges**, **Queues and Streams** (colonnes *Ready*, *Unacked*, *Consumers*) et **Bindings** de chaque exchange. En ligne de commande : `npm run lab:state` (compteurs des 5 queues + tables SQL) ; `npm run infra:status`.

## Topologie préconfigurée
Appliquée par `npm run infra:up` depuis `docker/rabbitmq/definitions.json` (idempotent ; `npm run infra:topology` la réapplique). Schéma : [docs/rabbitmq-topology.mmd](docs/rabbitmq-topology.mmd).

| Objet | Rôle |
|---|---|
| Exchange `orders.commands` (direct) | Point d'entrée des demandes de préparation ; reçoit aussi le retour des retries |
| Queue `orders.prepare` | Travail principal ; lié à `orders.commands` par **`order.prepare`** ; ses rejets définitifs partent vers `orders.dead` avec la clé **`order.failed`** |
| Exchange `orders.retry` (direct) | Aiguille une nouvelle tentative vers le bon délai : **`retry.1`** → 2 s, **`retry.2`** → 5 s, **`retry.3`** → 10 s |
| Queues `orders.retry.2s` / `.5s` / `.10s` | Attente : TTL de queue 2 000 / 5 000 / 10 000 ms, puis dead-letter vers `orders.commands` avec `order.prepare` — **le message revient à la queue principale par RabbitMQ**, jamais par un appel HTTP au producteur |
| Exchange `orders.dead` (direct) | Reçoit les rejets définitifs ; lié à la DLQ par **`order.failed`** |
| Queue `orders.prepare.dlq` | Isole les messages définitivement rejetés pour diagnostic |

Les délais (TTL) sont des délais **minimaux** : un message peut revenir plus tard. Voir [docs/limitations.md](docs/limitations.md).

## Contrat du message (`packages/contracts`)
```json
{ "schemaVersion": 1, "type": "OrderPreparationRequested", "operationId": "prepare-ORD-123", "orderId": "ORD-123", "attempt": 0, "requestedAt": "2026-11-10T10:00:00.000Z" }
```
- `operationId` : opération **métier**, stable entre republications et retries (initialement `prepare-<orderId>`).
- `messageId` (AMQP) : identifiant de **transport**, peut changer à chaque publication. `correlationId` : traçabilité transversale.
- `attempt` : 0 puis au plus 3 (**trois nouvelles tentatives**). Validation **à l'exécution** : `validatePreparationMessage()` / `validatePreparationValue()`.

## Base PostgreSQL (migration `database/migrations/001_init.sql`)
```sql
processed_operations(consumer_name, operation_id, processed_at)   -- PRIMARY KEY (consumer_name, operation_id)
prepared_orders(order_id PRIMARY KEY, operation_id UNIQUE, prepared_at)
```
Le traitement de préparation est **simulé par une écriture** dans `prepared_orders`. Aucun appel externe.

## Ce qui est fourni / ce qui reste à faire
Fourni et vert : TP1–TP3 intacts, infrastructure, topologie, migrations, contrat de message, connexion AMQP, boucle de consommation (ACK manuel, `prefetch=2`, reconnexion), journal, injections de panne, tests de fonctionnement.
À compléter : `grep -rn TODO_TP4 apps` (quatre zones) :

| # | Zone | Fichier |
|---|---|---|
| 1 | Publication confirmée : Confirm Channel, `persistent`, `mandatory`, confirm / `basic.return` / erreurs, back-pressure | `apps/order-service/src/messaging/preparation-publisher.ts` |
| 2 | Consommation : validation, effet métier **puis** ACK, `nack` des erreurs définitives | `apps/preparation-worker/src/consumer.ts` |
| 3 | Retries différés et bornés (2 s / 5 s / 10 s), puis DLQ | `apps/preparation-worker/src/retry.ts` (+ `consumer.ts`) |
| 4 | Idempotence : transaction commune déduplication + écriture, concurrence, crash après COMMIT avant ACK | `apps/preparation-worker/src/store.ts` |

Contrat cible de `POST /api/orders/:orderId/preparation` : **202** `{"orderId":"ORD-123","preparationStatus":"PENDING"}` uniquement si RabbitMQ a **confirmé une publication routée** ; broker indisponible ou publication non confirmée : **503** `application/problem+json` (jamais un faux 202). Commande inconnue : 404 ; `CANCELLED` ou `SHIPPED` : 409. La route ne modifie pas le statut de la commande (aucun événement WebSocket).
Tant qu'un TODO n'est pas fait, le starter **échoue sans annoncer de succès** : route en 501, worker qui n'acquitte jamais (le message reste *Unacked*).

## Tests
| Commande | Contenu |
|---|---|
| `npm run typecheck` / `npm run build` | Compilation TypeScript strict |
| `npm test` | **Smoke, vert dès le départ** : TP1–TP3, contrat de message, topologie et migrations déclarées, route, starter, RabbitMQ/PostgreSQL joignables |
| `npm run test:acceptance:tp4` | T1–T7 du TP4 (initialement partiellement rouges) |
| `npm run test:acceptance:tp3` | Non-régression des acceptances TP3 |
| `npm run test:acceptance` | Les deux |

| Test | Scénario | Preuve attendue (état SQL / queues) |
|---|---|---|
| T1 | Nominal | 202 ; une ligne `prepared_orders` ; queue vide, rien en *Unacked* |
| T2 | Worker arrêté | 202 ; *Ready* = 1 sans consommateur ; préparation après démarrage du worker |
| T3 | Crash après COMMIT, avant ACK | Redelivery (`redelivered=true`) ; **une seule** ligne |
| T4 / T4b | Dépendance en 503 | Retry différé ≈ 2 s puis succès ; panne durable : 2 s / 5 s / 10 s puis DLQ |
| T5 | JSON invalide | DLQ, sans retry, sans effet |
| T6 / bonus | Deux workers, même `operationId` (bonus : deux `operationId` pour un `orderId`) | Un seul effet métier |
| T7 | Broker arrêté | 503 (jamais 202) ; reprise après redémarrage |

Les tests lisent des **états** (compteurs de queues, lignes SQL, logs horodatés) avec attentes de condition, pas des `sleep` comme seule preuve.

## Injections de panne (laboratoire local, interdites si `NODE_ENV=production`)
| Test | Commande (Bash) | PowerShell |
|---|---|---|
| T2 | arrêtez le worker, puis `curl -X POST .../preparation` | idem avec `curl.exe` |
| T3 | `FAULT=EXIT_AFTER_COMMIT_BEFORE_ACK WORKER_NAME=worker-a npm run dev:worker` | `$env:FAULT="EXIT_AFTER_COMMIT_BEFORE_ACK"; $env:WORKER_NAME="worker-a"; npm run dev:worker` |
| T4 | `npm run lab:dependency-down -- --ms 5000` (rétablir : `-- --clear`) | idem |
| T5 | `npm run lab:invalid-json` | idem |
| T6 | `npm run lab:duplicates -- ORD-102` (bonus : ajoutez `--conflict`), puis deux workers `WORKER_NAME` différents | idem |
| T7 | `npm run lab:broker -- stop` puis `-- start` | idem |

Après un test avec `FAULT`, relancez le worker **sans** cette variable (PowerShell : `Remove-Item Env:FAULT`).

## Reset sans détruire les données étrangères
- `npm run reset` : supprime les `dist/` ; vide **uniquement** les 5 queues du TP4 et les 2 tables du laboratoire (la base doit se nommer `*_lab`) ; efface l'état d'injection (`.lab-state/`) ; signale les ports occupés. Il ne touche à aucune autre queue ni base.
- `npm run reset -- --topology` : supprime puis recrée les 5 queues du TP4 (si leurs arguments ont été modifiés).
- `npm run infra:down` : arrête les conteneurs (données de test conservées) ; `npm run infra:destroy` : supprime aussi le volume PostgreSQL de **ce** projet Compose.
- Les commandes du service Commandes sont en mémoire : relancer `npm run dev` rétablit `ORD-101..104`.

## Déroulement (80 min)
8 min **A** Diagnostic (lancer, repérer composants, queues, bindings ; prédire le sort d'un message si le worker s'arrête) · 15 min **B** Publication et consommation (TODO 1 et 2) · 18 min **C** Retries et DLQ (TODO 3) · 17 min **D** Idempotence (TODO 4, crash, doublons) · 10 min **E** Recette T1–T7 · 12 min **F** Mini-soutenance.
Pour chaque test : [docs/test-record-template.md](docs/test-record-template.md) — prédiction avant exécution, relevé réel ensuite.

## Pour les groupes rapides (facultatif)
Métriques de queues ; rejeu manuel contrôlé depuis la DLQ ; analyse du pattern Transactional Outbox ; limites multi-instances.

## Sécurité et limites
Connexion démo, `/demo/`, diagnostics, identifiants de laboratoire et injections de panne sont **refusés ou absents** si `NODE_ENV=production`. Pas de TLS ici. Garanties **at-least-once** : jamais « exactly-once ». Détails : [docs/limitations.md](docs/limitations.md). Architecture : [docs/architecture.mmd](docs/architecture.mmd).

Usage de l'IA autorisé pour l'aide au code ; toute proposition doit être vérifiée expérimentalement, expliquée individuellement et adaptée aux contrats du dépôt.
