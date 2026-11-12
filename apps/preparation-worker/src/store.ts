import { WORKER_CONSUMER_NAME } from '@infal73/contracts';
import type { PreparationCommand } from '@infal73/contracts';
import type pg from 'pg';
import { NotImplementedTp4Error } from './errors.js';

/**
 * Résultat d'une tentative de préparation.
 *  - `prepared`  : l'effet métier vient d'être écrit (et validé par COMMIT) ;
 *  - `duplicate` : cette opération (même operationId) avait déjà été traitée — aucun nouvel effet ;
 *  - `conflict`  : demande CONTRADICTOIRE — la commande est déjà préparée par une AUTRE opération (operationId différent).
 *                  À ne pas confondre avec un doublon autorisé : décidez et documentez comment le traiter.
 */
export type PrepareOutcome = { kind: 'prepared' } | { kind: 'duplicate' } | { kind: 'conflict'; existingOperationId: string };

/** Point d'intégration appelé par le consommateur AVANT tout `ack`. */
export interface PreparationStore {
  prepareIdempotently(command: PreparationCommand): Promise<PrepareOutcome>;
}

export class PgPreparationStore implements PreparationStore {
  constructor(
    private readonly pool: pg.Pool,
    readonly consumerName: string = WORKER_CONSUMER_NAME,
  ) {}

  async prepareIdempotently(_command: PreparationCommand): Promise<PrepareOutcome> {
    void this.pool;
    // TODO_TP4(4) — Idempotence PostgreSQL :
    //   • la déduplication (processed_operations) et l'effet métier (prepared_orders) dans UNE SEULE transaction ;
    //   • s'appuyer sur les contraintes (PRIMARY KEY / UNIQUE), pas sur un SELECT préalable ;
    //   • sous concurrence (deux workers, même operationId) : un seul effet ;
    //   • même orderId avec un autre operationId : ne pas préparer deux fois ;
    //   • l'ACK RabbitMQ n'est PAS dans la transaction : il intervient après le COMMIT (et après faults.afterCommitBeforeAck).
    throw new NotImplementedTp4Error('TODO_TP4(4) prepareIdempotently');
  }
}
