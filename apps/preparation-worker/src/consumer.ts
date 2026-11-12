import type { Channel, ConsumeMessage } from 'amqplib';
import type { WorkerConfig } from './config.js';
import type { LabFaults } from './lab-faults.js';
import type { Logger } from './logger.js';
import type { RetryScheduler } from './retry.js';
import type { PreparationStore } from './store.js';

export interface ConsumerDeps {
  /** Canal de consommation (prefetch déjà réglé, consommation en ACK manuel : `noAck: false`). */
  channel: Channel;
  config: WorkerConfig;
  store: PreparationStore;
  retries: RetryScheduler;
  faults: LabFaults;
  log: Logger;
}

/**
 * Traite UNE livraison de `orders.prepare`. Appelée par server.ts après le journal `delivery.received`.
 *
 * État du starter : le message n'est ni acquitté ni rejeté — il reste « unacked » jusqu'à la fermeture du canal
 * (puis il est remis en queue). Aucun succès n'est annoncé tant que vous n'avez pas complété les TODO.
 * Une exception qui s'échappe de cette fonction est journalisée et laisse, elle aussi, le message non acquitté.
 */
export async function handleDelivery(deps: ConsumerDeps, msg: ConsumeMessage): Promise<void> {
  void deps.channel;
  void deps.store;
  void deps.retries;
  void deps.faults;
  // TODO_TP4(2) — Consommation et validation :
  //   • valider le contenu À L'EXÉCUTION (voir @infal73/contracts) ; contenu invalide = erreur DÉFINITIVE : nack(msg, false, false) ;
  //   • effectuer l'effet métier (store.prepareIdempotently), puis seulement ensuite ack(msg) ;
  //   • journaliser « opération métier terminée » (distinct de « livraison reçue »).
  // TODO_TP4(3) — Fiabilité :
  //   • classer les erreurs : temporaires (ex. TemporaryDependencyError, via faults.callDependency()) ou définitives ;
  //   • temporaire : retries.scheduleRetry(...) PUIS ack ; épuisé (attempt = 3) ou définitive : nack sans requeue (-> DLQ) ;
  //   • jamais de nack avec requeue illimité.
  // TODO_TP4(4) — Après le COMMIT et avant l'ACK, appeler faults.afterCommitBeforeAck({ operationId, orderId }).
  deps.log('delivery.unhandled', {
    deliveryTag: msg.fields.deliveryTag,
    note: 'TODO_TP4 not implemented: message left unacknowledged on purpose',
  });
}
