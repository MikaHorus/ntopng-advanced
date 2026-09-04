# Évolution de l'application — Ajout de l'historique de navigation persistant

## État actuel

Actuellement, l'ensemble des fonctionnalités de l'application fonctionne correctement, à l'exception de l'onglet **Domaines**, qui nécessite encore d'être corrigé.

Avant d'ajouter les nouvelles fonctionnalités, analyser et corriger le problème de l'onglet Domaines sans casser les fonctionnalités existantes.

---

# Nouvelle fonctionnalité : Historique de navigation persistant

## Objectif

Je souhaite désormais ajouter un système de stockage persistant des historiques de navigation.

Actuellement, les données récupérées depuis ntopng dépendent de la disponibilité et de la rétention des données côté ntopng.

Je souhaite donc enregistrer les informations de navigation récupérées dans une base de données PostgreSQL afin de pouvoir conserver et consulter les historiques sur le long terme.

L'objectif est de pouvoir retrouver les historiques de navigation même lorsque les données ne sont plus disponibles directement dans ntopng.

---

# Base de données PostgreSQL

Ajouter PostgreSQL à l'architecture de l'application.

La base PostgreSQL sera utilisée pour stocker les historiques de navigation récupérés depuis ntopng.

Architecture cible :

```text
ntopng sur pfSense
        |
        | API REST
        v
FastAPI
        |
        | Collecte et traitement
        v
PostgreSQL
        |
        | API interne
        v
React
```

## Important

ntopng reste la source de collecte des données réseau.

PostgreSQL devient la source de conservation et de consultation historique à long terme.

Le système doit éviter les doublons lors de l'enregistrement des données.

---

# Nouveau menu : Historique de navigation

Ajouter un nouveau menu dans l'application :

```text
Navigation
├── Historique de navigation
├── Domaines
└── Connexions
```

Ou intégrer ce nouveau menu de manière cohérente avec l'architecture actuelle de l'application.

---

# Page Historique de navigation

Créer une nouvelle page :

```text
Historique de navigation
```

Cette page doit afficher les historiques enregistrés dans PostgreSQL sous forme de tableau.

Chaque ligne représente une activité de navigation ou une visite de domaine détectée.

## Colonnes obligatoires

Le tableau doit afficher au minimum :

| Date | Heure | Adresse IP locale | Nom d'hôte | Domaine visité |
|---|---|---|---|---|

Exemple :

| Date | Heure | IP locale | Nom d'hôte | Domaine |
|---|---|---|---|---|
| 04/09/2026 | 09:30:15 | 192.168.1.25 | PC-BUREAU-01 | google.com |
| 04/09/2026 | 09:32:48 | 192.168.1.30 | LAPTOP-USER | youtube.com |

Selon les données disponibles, il sera possible d'ajouter ultérieurement :

- Adresse MAC.
- Adresse IP distante.
- Application détectée.
- Protocole.
- Interface réseau.

---

# Pagination obligatoire

L'historique peut contenir un volume important de données.

Il est donc obligatoire d'implémenter une pagination côté serveur.

Le frontend ne doit jamais charger l'intégralité de l'historique en une seule requête.

## Paramètres

```text
page
page_size
```

Valeurs recommandées :

```text
page = 1 par défaut

page_size = 50 par défaut

page_size maximum = 100 ou 200
```

La réponse API doit inclure les informations de pagination.

Exemple :

```json
{
    "items": [],
    "page": 1,
    "page_size": 50,
    "total": 12500,
    "total_pages": 250
}
```

Le frontend doit afficher :

- Page actuelle.
- Nombre total d'enregistrements.
- Navigation page précédente/suivante.
- Possibilité de changer le nombre d'éléments par page.

---

# Filtres et recherche

Prévoir dès maintenant une architecture permettant d'ajouter ou d'utiliser les filtres suivants :

- Date de début.
- Date de fin.
- Adresse IP locale.
- Nom d'hôte.
- Domaine.

Les filtres doivent être exécutés côté backend et directement au niveau de la requête PostgreSQL.

Ne jamais charger toutes les données dans FastAPI pour effectuer le filtrage en mémoire.

---

# Recherche

Ajouter une recherche permettant de rechercher rapidement :

- Une adresse IP locale.
- Un nom d'hôte.
- Un domaine.

La recherche doit être optimisée pour fonctionner même avec un grand volume de données.

---

# Modèle de données PostgreSQL

Créer un modèle dédié à l'historique de navigation.

Structure minimale recommandée :

```text
navigation_history
```

Champs :

```text
id

timestamp

local_ip

hostname

domain

remote_ip (optionnel)

protocol (optionnel)

application (optionnel)

interface_id (optionnel)

created_at
```

## Exemple SQL conceptuel

```sql
CREATE TABLE navigation_history (
    id BIGSERIAL PRIMARY KEY,

    timestamp TIMESTAMP NOT NULL,

    local_ip VARCHAR(45) NOT NULL,

    hostname VARCHAR(255),

    domain VARCHAR(255) NOT NULL,

    remote_ip VARCHAR(45),

    protocol VARCHAR(50),

    application VARCHAR(100),

    interface_id VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# Indexation PostgreSQL

Comme cette table peut devenir volumineuse, ajouter des index adaptés.

Index minimum recommandés :

```text
timestamp

local_ip

domain
```

Exemple conceptuel :

```sql
CREATE INDEX idx_navigation_history_timestamp
ON navigation_history(timestamp);

CREATE INDEX idx_navigation_history_local_ip
ON navigation_history(local_ip);

CREATE INDEX idx_navigation_history_domain
ON navigation_history(domain);
```

Étudier également la possibilité d'ajouter un index composite selon les requêtes les plus fréquentes.

Exemple :

```text
(timestamp, local_ip)
```

---

# Prévention des doublons

Le système de collecte ne doit pas enregistrer plusieurs fois le même événement.

Avant de sauvegarder une donnée provenant de ntopng, prévoir un mécanisme d'identification unique.

Selon les données disponibles, utiliser une combinaison comme :

```text
timestamp
+
local_ip
+
domain
+
remote_ip
```

ou un identifiant unique fourni par ntopng si celui-ci existe.

Ne pas mettre en place une contrainte unique sans analyser les données réelles, car plusieurs connexions légitimes peuvent avoir les mêmes caractéristiques.

Le mécanisme final de déduplication doit être adapté aux données réellement disponibles.

---

# Collecte des données depuis ntopng

Créer un système de collecte permettant de récupérer régulièrement les nouvelles données depuis ntopng et de les enregistrer dans PostgreSQL.

Architecture :

```text
ntopng
   |
   v
NtopngClient
   |
   v
NavigationHistoryCollector
   |
   v
Validation / Transformation
   |
   v
Déduplication
   |
   v
PostgreSQL
```

Le système doit récupérer uniquement les nouvelles données lorsque cela est possible.

Éviter de récupérer et retraiter tout l'historique à chaque exécution.

---

# Planification de la collecte

Prévoir un système de tâche planifiée pour synchroniser régulièrement les données.

Exemple :

```text
Toutes les 1 minute
Toutes les 5 minutes
```

La fréquence doit être configurable.

Technologie possible :

- APScheduler pour une première implémentation simple.

Ne pas ajouter Celery ou une infrastructure complexe si ce n'est pas nécessaire.

---

# Point de synchronisation

Conserver l'état de la dernière synchronisation.

Exemple :

```text
last_sync_timestamp
```

Cela permet de récupérer uniquement les nouvelles données.

Prévoir une table ou un système de configuration dédié :

```text
sync_state
```

Exemple :

| id | source | last_sync_timestamp |
|---|---|---|
| 1 | ntopng | 2026-09-04 09:30:00 |

---

# API Backend

Ajouter les endpoints suivants.

## Liste de l'historique

```http
GET /api/v1/navigation-history
```

Paramètres :

```text
page
page_size

date_from
date_to

local_ip
hostname
domain

search
```

---

## Réponse

```json
{
    "items": [
        {
            "id": 1,
            "timestamp": "2026-09-04T09:30:15",
            "local_ip": "192.168.1.25",
            "hostname": "PC-BUREAU-01",
            "domain": "google.com"
        }
    ],
    "page": 1,
    "page_size": 50,
    "total": 12500,
    "total_pages": 250
}
```

---

# Endpoint de synchronisation

Prévoir un endpoint interne ou administrateur permettant de déclencher manuellement une synchronisation.

Exemple :

```http
POST /api/v1/navigation-history/sync
```

Cet endpoint doit être protégé et accessible uniquement aux administrateurs.

---

# Interface Frontend

Créer une page React dédiée :

```text
NavigationHistory.tsx
```

Utiliser une DataTable avec :

- Pagination serveur.
- Tri.
- Recherche.
- Filtres.
- État de chargement.
- Gestion des erreurs.
- État vide.

La pagination doit être entièrement pilotée par l'API backend.

Le frontend ne doit jamais télécharger l'ensemble de l'historique.

---

# Performance

Cette fonctionnalité doit être conçue pour supporter une croissance importante des données.

Respecter les règles suivantes :

1. Pagination obligatoire.
2. Requêtes SQL optimisées.
3. Index PostgreSQL adaptés.
4. Filtres exécutés côté base de données.
5. Ne jamais charger l'intégralité de l'historique en mémoire.
6. Utiliser des limites sur les requêtes.
7. Éviter les N+1 queries.
8. Prévoir l'archivage futur si le volume devient très important.

---

# Docker

Ajouter PostgreSQL au `docker-compose.yml`.

Service attendu :

```text
postgres
```

Le service doit utiliser un volume persistant.

Exemple conceptuel :

```text
postgres_data
```

Les données doivent survivre aux redémarrages des conteneurs.

Ne jamais utiliser `docker compose down -v` en environnement de production sans validation explicite.

---

# Migrations

Utiliser Alembic pour gérer le schéma PostgreSQL.

Créer les migrations nécessaires pour :

```text
navigation_history

sync_state
```

Ne jamais créer ou modifier les tables manuellement en production.

---

# Correction de l'onglet Domaines

Avant ou pendant cette évolution, analyser pourquoi l'onglet **Domaines** ne fonctionne pas.

Vérifier :

1. L'endpoint backend.
2. Les données retournées par ntopng.
3. La transformation des données.
4. Les schémas Pydantic.
5. La réponse API.
6. La requête frontend.
7. Les erreurs dans la console navigateur.
8. Les erreurs backend.

Ne pas supprimer la fonctionnalité.

Identifier la cause réelle et corriger le problème.

---

# Ordre de développement obligatoire

Claude Code doit respecter cet ordre :

## Étape 1

Analyser l'architecture actuelle du projet.

Identifier :

- Structure backend.
- Structure frontend.
- Configuration Docker.
- Configuration ntopng.
- Système de récupération actuel des domaines.

---

## Étape 2

Diagnostiquer et corriger l'onglet Domaines.

Ne pas modifier inutilement les autres fonctionnalités.

---

## Étape 3

Ajouter PostgreSQL.

Créer :

- Configuration.
- Service Docker.
- Volume persistant.
- Variables d'environnement.

---

## Étape 4

Configurer SQLAlchemy et Alembic.

Créer les modèles et migrations.

---

## Étape 5

Créer le système de stockage des historiques.

Créer :

```text
NavigationHistory
NavigationHistoryRepository
NavigationHistoryService
```

---

## Étape 6

Créer le mécanisme de synchronisation ntopng → PostgreSQL.

Implémenter :

- Collecte.
- Transformation.
- Déduplication.
- Sauvegarde.
- Gestion du dernier point de synchronisation.

---

## Étape 7

Tester le stockage et la synchronisation.

Vérifier notamment :

- Absence de doublons.
- Persistance après redémarrage.
- Gestion des erreurs ntopng.
- Reprise après interruption.

---

## Étape 8

Créer l'API paginée.

Tester les performances avec un volume important de données.

---

## Étape 9

Créer le nouveau menu et la page React :

```text
Historique de navigation
```

---

## Étape 10

Ajouter les filtres et la recherche.

---

# Règles strictes

Claude Code ne doit pas :

- Casser les fonctionnalités actuellement opérationnelles.
- Supprimer une fonctionnalité existante sans raison.
- Charger tout l'historique dans le navigateur.
- Charger tout l'historique dans FastAPI.
- Filtrer les données en mémoire.
- Créer une base de données sans volume persistant.
- Enregistrer des doublons.
- Hardcoder les identifiants PostgreSQL.
- Exposer PostgreSQL publiquement sans nécessité.
- Exposer les identifiants ntopng au frontend.

---

# Objectif final

L'application doit fonctionner selon cette architecture :

```text
                    +----------------+
                    |    pfSense     |
                    |                |
                    |     ntopng     |
                    +----------------+
                            |
                            | Collecte régulière
                            v
                    +----------------+
                    |    FastAPI     |
                    |                |
                    | Synchronisation|
                    | Normalisation  |
                    +----------------+
                            |
                            v
                    +----------------+
                    |   PostgreSQL   |
                    |                |
                    | Historique     |
                    | persistant     |
                    +----------------+
                            |
                            v
                    +----------------+
                    |     React      |
                    |                |
                    | Historique     |
                    | Pagination    |
                    | Recherche     |
                    | Filtres       |
                    +----------------+
```

## Résultat attendu

Les données de navigation détectées par ntopng doivent être progressivement enregistrées dans PostgreSQL afin de constituer un historique persistant.

L'utilisateur doit pouvoir consulter cet historique à tout moment via le nouveau menu **Historique de navigation**, avec une interface performante et paginée.

Les informations affichées doivent au minimum contenir :

```text
Date
Heure
Adresse IP locale
Nom d'hôte
Domaine visité
```

La conception doit permettre d'ajouter ultérieurement :

- Export CSV/Excel de l'historique.
- Statistiques par utilisateur ou machine.
- Statistiques par domaine.
- Durée de rétention configurable.
- Archivage automatique.
- Rapports périodiques.