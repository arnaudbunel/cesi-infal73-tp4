import type { BrokerConnection } from './broker-connection.js';
import { NotImplementedTp4Error } from './errors.js';

export interface PublishInput {
  exchange: string;
  routingKey: string;
  /** Corps du message : sérialisé en JSON par la publication. */
  payload: unknown;
  /** `mandatory=true` attendu : un message non routable doit être renvoyé par le broker (`basic.return`). */
  mandatory: boolean;
  /** `persistent=true` attendu (delivery mode 2). */
  persistent: boolean;
  /** Traçabilité transversale (propriété AMQP `correlationId`). */
  correlationId?: string;
}

/** Reçu d'une publication CONFIRMÉE et routée. */
export interface PublishReceipt {
  /** Identifiant de transport de CE message (peut changer à chaque republication, contrairement à l'`operationId`). */
  messageId: string;
}

/**
 * Contrat de `publishConfirmed` :
 *  - se résout UNIQUEMENT après confirmation du broker ET absence de `basic.return` (message routé) ;
 *  - sinon se rejette avec une `PublishError` (`kind` : voir ./errors.ts) ; une erreur d'un autre type reste une erreur interne ;
 *  - le booléen retourné par `channel.publish()` (back-pressure) n'est PAS une confirmation.
 */
export interface PreparationPublisher {
  publishConfirmed(input: PublishInput): Promise<PublishReceipt>;
}

export class RabbitPreparationPublisher implements PreparationPublisher {
  constructor(private readonly broker: BrokerConnection) {}

  async publishConfirmed(_input: PublishInput): Promise<PublishReceipt> {
    void this.broker; // `this.broker.getConfirmChannel()` fournit le Confirm Channel (voir broker-connection.ts).
    // TODO_TP4(1) — Publication confirmée :
    //   • Confirm Channel + message persistant + mandatory ;
    //   • distinguer : confirm positif, basic.return (non routé), basic.nack, canal/connexion fermés ;
    //   • tenir compte du booléen de back-pressure sans le confondre avec une confirmation ;
    //   • renseigner contentType, messageId, correlationId.
    throw new NotImplementedTp4Error('TODO_TP4(1) publishConfirmed');
  }
}
