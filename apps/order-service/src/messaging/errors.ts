/** Levée par les points d'extension du TP4 qui n'ont pas encore été complétés. Jamais convertie en succès. */
export class NotImplementedTp4Error extends Error {
  constructor(readonly todo: string) {
    super(`${todo} is not implemented yet`);
    this.name = 'NotImplementedTp4Error';
  }
}

/**
 * Issue d'une publication qui n'est PAS une prise en charge confirmée et routée.
 * - `broker-unavailable` : connexion/canal indisponible ou fermé avant l'envoi ;
 * - `unroutable`         : le broker a renvoyé le message (`basic.return`) : aucune queue ne l'a reçu ;
 * - `nacked`             : le broker a refusé la publication (`basic.nack` du confirm) ;
 * - `outcome-unknown`    : la connexion/le canal s'est fermé avant la confirmation : on ne sait pas si le message est en queue.
 */
export type PublishFailureKind = 'broker-unavailable' | 'unroutable' | 'nacked' | 'outcome-unknown';

export class PublishError extends Error {
  constructor(readonly kind: PublishFailureKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PublishError';
  }
}
