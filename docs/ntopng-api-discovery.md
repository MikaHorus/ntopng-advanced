# PHASE 0 - NTOPNG API DISCOVERY

## Statut

Découverte partiellement validée le 03/09/2026.

URL fournie : `https://192.168.0.1:3000/`

Le token fourni est utilise uniquement hors du depot pour les tests de connexion.
Il ne doit pas etre ajoute a un fichier versionne ni a la documentation.

Cette application ne suppose ni la version ntopng, ni sa methode d'authentification,
ni la presence d'endpoints metier.

## Informations a relever

- Version ntopng : a confirmer
- Edition ntopng : a confirmer
- Version pfSense : a confirmer
- Interface surveillee : a confirmer
- URL testee : a confirmer
- HTTPS et certificat : a confirmer
- Methode d'authentification : token HTTP, en-tete `Authorization: Token <token>`

## Endpoints valides

Endpoints documentes a tester sur l'instance :

- `GET /lua/rest/v2/get/ntopng/interfaces.lua`
- `GET /lua/rest/v2/get/interface/data.lua?ifid=<ifid>`
- `GET /lua/rest/v2/get/host/active.lua?ifid=<ifid>`
- `GET /lua/rest/v2/get/flow/active.lua?ifid=<ifid>`

Résultats observés sur l'instance fournie :

- `GET /lua/rest/v2/get/ntopng/interfaces.lua` : HTTP 200, `rc=0`, interface `em0`, `ifid=0`
- `GET /lua/rest/v2/get/interface/data.lua?ifid=0` : HTTP 200, `rc=0`
- `GET /lua/rest/v2/get/host/active.lua?ifid=0` : HTTP 200, `rc=0`
- `GET /lua/rest/v2/get/flow/active.lua?ifid=0` : HTTP 200, `rc=0`

Ces endpoints sont retenus pour le premier backend fonctionnel.

## Endpoint non accessible

- `POST /lua/pro/rest/v2/get/db/flows.lua` : HTTP 403 avec une requête JSON conforme à la documentation.

L'historique des flows n'est donc pas déclaré disponible. La cause exacte reste à
confirmer : droits du token, licence ntopng ou configuration du module historique.

## Limitations a verifier

- Presence et retention des flows historiques
- Disponibilite des domaines ou informations DNS
- Disponibilite des applications et protocoles
- Presence de ClickHouse ou d'une autre base externe
- Limitation des donnees a la memoire de ntopng

## Prochaine action

Renseigner `NTOPNG_BASE_URL` et les parametres d'authentification dans un fichier
`.env` local non versionne, puis executer le test de connectivite de Phase 0.