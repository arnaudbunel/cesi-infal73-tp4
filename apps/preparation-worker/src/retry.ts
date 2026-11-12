import type { PreparationCommand } from '@infal73/contracts';
import type { ConfirmChannel } from 'amqplib';
import { NotImplementedTp4Error } from './errors.js';
import type { Logger } from './logger.js';

/** Planification d'une nouvelle tentative différée (topologie : voir docs/rabbitmq-topology.mmd). */
export interface RetryScheduler {
  /**
   * Republie `command` (operationId INCHANGÉ, attempt incrémenté) vers l'exchange `orders.retry`,
   * et ne se résout qu'après CONFIRMATION de la republication (et absence de basic.return).
   * Se rejette si la republication n'est pas confirmée : l'original ne doit alors PAS être acquitté.
   */
  scheduleRetry(command: PreparationCommand, context: { correlationId?: string }): Promise<void>;
}

export class ConfirmedRetryScheduler implements RetryScheduler {
  constructor(
    private readonly retryChannel: ConfirmChannel,
    private readonly log: Logger,
  ) {}

  async scheduleRetry(_command: PreparationCommand, _context: { correlationId?: string }): Promise<void> {
    void this.retryChannel;
    void this.log;
    // TODO_TP4(3) — Retries limités et différés :
    //   • choisir la clé de routage selon attempt (voir README : 2 s, 5 s, 10 s ; au plus 3 nouvelles tentatives) ;
    //   • republier de façon confirmée (mandatory, persistant), nouveau messageId, operationId stable ;
    //   • ne rien acquitter ici : l'ACK de l'original appartient au consommateur, et seulement après la confirmation.
    throw new NotImplementedTp4Error('TODO_TP4(3) scheduleRetry');
  }
}
