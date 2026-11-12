# Limites assumées du laboratoire TP4

- **Queues classiques, un seul nœud** : aucune haute disponibilité ni réplication. En production, réévaluer le type de queue (par ex. quorum queues), la réplication et la gestion de configuration par *policy*.
- **At-least-once, jamais exactly-once** : l'ACK RabbitMQ n'est pas atomique avec le COMMIT PostgreSQL ; une redelivery ou une republication peut faire réapparaître une opération. L'idempotence côté base garantit l'effet métier, pas l'unicité des livraisons.
- **Retries à TTL fixes** : choisis pour visualiser les délais. Un TTL est un délai minimal, pas une échéance garantie. En production : *policy*, délais avec gigue (*jitter*), supervision.
- **DLQ** : elle isole un message, elle ne résout pas l'incident ; diagnostic, correction et décision de rejeu restent nécessaires (rejeu automatique hors périmètre).
- **Confirmation incertaine** : si la connexion se ferme avant le confirm, on ne sait pas si le message est en queue ; republier est sûr uniquement grâce à l'`operationId` stable et à la déduplication.
- **`operationId` / `orderId`** : une demande contradictoire (même commande, autre `operationId`) n'est pas un doublon autorisé ; son traitement est une décision de conception à documenter. Le message de préparation de l'API vérifie l'existence de la commande et refuse `CANCELLED` / `SHIPPED`, mais ne sait pas si elle a déjà été préparée (PostgreSQL appartient au worker) : un second POST republie la même opération, dédupliquée par le worker.
- **Sécurité** : AMQP, HTTP, gRPC et WebSocket sans TLS ; identifiants factices ; ports liés à `127.0.0.1`. Le mode démo, les identifiants de laboratoire et `FAULT` sont refusés si `NODE_ENV=production`.
- **Effets externes** : une transaction locale ne rend pas un appel externe (paiement, e-mail) exactement-une-fois : voir Transactional Outbox et clés d'idempotence du prestataire.
- **Multi-instances** : le registre d'abonnements WebSocket reste en mémoire (TP3) ; plusieurs workers partagent la même base et sa contrainte d'unicité.
- Les compteurs du Management sont rafraîchis toutes les 500 ms dans ce laboratoire (5 s par défaut) : lisez-les après stabilisation.
