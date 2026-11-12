# Relevé de tests TP4 — groupe : ______ · date : ______

Une ligne par test. Écrivez la **prédiction avant** de lancer ; ne consignez que ce que vous avez réellement observé (aucune donnée sensible). Une prédiction fausse mais bien analysée vaut mieux qu'un résultat recopié.
`npm run lab:state` donne les compteurs de queues et l'état SQL ; les logs sont horodatés (ISO 8601).

| Test | Prédiction (avant) | Action / commande exacte | HTTP | RabbitMQ ready / unacked (avant → après) | Résultat PostgreSQL | Log / horodatage (operationId, attempt) | Conclusion (écart prédiction ↔ observation) |
|---|---|---|---|---|---|---|---|
| T1 nominal | | | | | | | |
| T2 worker arrêté | | | | | | | |
| T3 crash après COMMIT, avant ACK | | | | | | | |
| T4 dépendance 503 → retry différé | | | | | | | |
| T5 JSON invalide → DLQ | | | | | | | |
| T6 deux workers, même operationId | | | | | | | |
| T7 broker indisponible | | | | | | | |

## Questions de justification (individuelles)
1. Que garantit exactement un Publisher Confirm, et que ne garantit-il pas ?
2. Pourquoi attendre la fin de l'écriture métier pour acquitter ? Quelle erreur produit un ACK avant le COMMIT ?
3. Comment prouver qu'une seconde livraison n'a pas déclenché une deuxième préparation ?
4. Que feriez-vous différemment si le traitement appelait un prestataire de paiement ?

## Décision d'architecture (5 à 8 lignes)
Deux choix de votre groupe : risque contrôlé, compromis, limite qui demeure.

## Extensions facultatives
Métriques de queues · rejeu manuel contrôlé depuis la DLQ · Transactional Outbox · limites multi-instances.
