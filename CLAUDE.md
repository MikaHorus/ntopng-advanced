# CLAUDE.md

# Ntopng Navigation History Viewer

## 1. Présentation du projet

Ce projet consiste à développer une application web permettant de consulter, rechercher, analyser et exporter les données de navigation et de trafic réseau collectées par **ntopng**, déjà installé et intégré dans **pfSense**.

L'objectif est de fournir une interface moderne et simplifiée permettant aux administrateurs réseau d'analyser facilement les activités réseau des machines locales.

L'application doit fonctionner comme une couche d'analyse au-dessus de ntopng.

```text
ntopng = collecte et analyse du trafic réseau

FastAPI = API intermédiaire, normalisation et traitement

React = interface utilisateur, visualisation et export
```

---

# 2. Contexte de l'infrastructure existante

## pfSense et ntopng

ntopng est déjà installé et intégré dans pfSense.

Il est accessible via :

```text
http://IP_PFSENSE:3000
```

Exemple :

```text
http://192.168.1.1:3000
```

L'application ne doit PAS installer une nouvelle instance de ntopng.

L'application doit uniquement communiquer avec l'instance ntopng déjà existante sur pfSense.

Architecture actuelle :

```text
                        Internet
                            |
                            v
                    +----------------+
                    |    pfSense     |
                    |                |
                    | Firewall / NAT |
                    |                |
                    |     ntopng     |
                    |   Port 3000    |
                    +----------------+
                            |
                            | REST API
                            |
                            v
                  +-------------------+
                  |  FastAPI Backend  |
                  |      Python       |
                  +-------------------+
                            |
                            | Internal API
                            |
                            v
                  +-------------------+
                  |  React Frontend   |
                  +-------------------+
                            |
                            v
                       Administrateur
```

---

# 3. Objectif principal

L'application doit permettre de consulter les données disponibles dans ntopng, notamment selon les capacités réellement exposées par l'instance ntopng installée sur pfSense.

Les fonctionnalités recherchées sont :

- Consulter les machines du réseau local.
- Identifier les adresses IP locales.
- Identifier les noms d'hôtes.
- Consulter les connexions réseau.
- Consulter les flux réseau.
- Identifier les domaines détectés.
- Identifier les IP distantes.
- Consulter les protocoles utilisés.
- Consulter les applications détectées par ntopng.
- Analyser le volume de trafic.
- Rechercher une activité spécifique.
- Filtrer les données par période.
- Exporter les données.
- Générer des statistiques.

---

# 4. Règle fondamentale : ne jamais supposer les capacités de ntopng

## IMPORTANT

Avant de développer une fonctionnalité basée sur ntopng, vérifier que les données nécessaires sont réellement disponibles via l'API de l'instance ntopng utilisée.

Claude Code ne doit jamais :

- Inventer un endpoint ntopng.
- Supposer qu'un endpoint REST existe.
- Supposer la structure d'une réponse JSON.
- Supposer que l'historique des flows est disponible.
- Supposer que les domaines visités sont accessibles.
- Supposer que les URLs complètes sont disponibles.
- Supposer la méthode d'authentification.
- Utiliser une documentation d'une autre version sans validation.

Toute intégration ntopng doit être validée à partir de :

1. L'API réellement accessible sur l'instance.
2. La version installée.
3. La documentation officielle correspondant à cette version.
4. Les réponses réelles retournées par ntopng.

---

# 5. Phase obligatoire avant développement : Audit ntopng

## CLAUDE CODE DOIT COMMENCER PAR CETTE ÉTAPE

Avant de développer le frontend ou les fonctionnalités métier, réaliser un audit technique complet de ntopng.

Créer une phase appelée :

```text
PHASE 0 — NTOPNG API DISCOVERY
```

Objectifs :

### 5.1 Identifier la version

Déterminer :

- Version ntopng.
- Édition ntopng.
- Version pfSense.
- Interface réseau surveillée.

---

### 5.2 Vérifier l'accessibilité

Tester :

```text
http://IP_PFSENSE:3000
```

Vérifier :

- Connectivité réseau.
- Accessibilité du port 3000.
- HTTP ou HTTPS.
- Certificat SSL si applicable.

---

### 5.3 Identifier l'authentification

Déterminer la méthode utilisée :

- Session Cookie.
- HTTP Basic Authentication.
- API Key.
- Token.
- Autre mécanisme spécifique à ntopng.

Ne jamais implémenter une méthode d'authentification sans validation préalable.

---

### 5.4 Identifier les endpoints disponibles

Tester et documenter les capacités permettant éventuellement de récupérer :

```text
Interfaces réseau
Hosts
Flows
Historical Flows
DNS Information
Domains
Applications
Protocols
Statistics
Traffic
Top Talkers
Local Hosts
Remote Hosts
```

Les endpoints exacts doivent être découverts et validés.

---

### 5.5 Vérifier les données historiques

Déterminer précisément :

- Si ntopng conserve les flows historiques.
- Pendant combien de temps.
- Où ces données sont stockées.
- Si une base externe est utilisée.
- Si ClickHouse est utilisé.
- Si les données sont accessibles via API.
- Si les données sont uniquement disponibles en mémoire.
- Si les données sont limitées à une période donnée.

---

# 6. Limitation importante concernant HTTPS

L'application ne doit pas promettre un historique complet des pages web visitées.

Avec HTTPS, ntopng peut éventuellement identifier :

- Le domaine.
- Le serveur distant.
- Le SNI TLS.
- Les informations DNS.
- Le protocole.
- L'application détectée.

Mais ntopng ne peut pas nécessairement fournir :

```text
https://youtube.com/watch?v=XXXXXXXX
```

Il est donc important de distinguer :

```text
Domaine visité
```

et

```text
URL complète visitée
```

L'objectif principal de l'application est donc l'analyse de l'activité réseau et des domaines détectés.

---

# 7. Architecture technique

## Backend

Technologies obligatoires :

- Python 3.12+
- FastAPI
- Pydantic v2
- HTTPX
- Pandas
- OpenPyXL
- SQLAlchemy si une base locale devient nécessaire
- Redis si le cache devient nécessaire

Tests :

- Pytest
- Pytest-AsyncIO

---

## Frontend

Technologies :

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- TanStack Table
- Axios ou Fetch API
- Recharts pour les graphiques

---

## Déploiement

L'application doit être compatible avec :

```text
Docker
Docker Compose
```

Services prévus :

```text
frontend
backend
redis (optionnel)
```

Aucune nouvelle instance ntopng ne doit être créée dans Docker.

ntopng reste exclusivement hébergé dans pfSense.

---

# 8. Architecture réseau

Architecture obligatoire :

```text
Utilisateur
    |
    | HTTPS
    v
React Frontend
    |
    | API HTTP/HTTPS
    v
FastAPI Backend
    |
    | REST API
    | Réseau local uniquement
    v
pfSense
IP_PFSENSE:3000
    |
    v
ntopng
```

## Règles strictes

Le frontend React ne doit JAMAIS communiquer directement avec ntopng.

Le navigateur ne doit jamais connaître :

- L'adresse IP interne de pfSense.
- Les identifiants ntopng.
- Les tokens ntopng.
- Les clés API ntopng.

Toutes les communications avec ntopng passent obligatoirement par FastAPI.

---

# 9. Architecture Backend

Structure recommandée :

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── router.py
│   │       ├── dashboard.py
│   │       ├── navigation.py
│   │       ├── hosts.py
│   │       ├── domains.py
│   │       ├── flows.py
│   │       ├── exports.py
│   │       └── settings.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── security.py
│   │
│   ├── clients/
│   │   └── ntopng_client.py
│   │
│   ├── services/
│   │   ├── ntopng_service.py
│   │   ├── navigation_service.py
│   │   ├── analytics_service.py
│   │   └── export_service.py
│   │
│   ├── schemas/
│   │   ├── common.py
│   │   ├── host.py
│   │   ├── flow.py
│   │   ├── navigation.py
│   │   ├── domain.py
│   │   └── dashboard.py
│   │
│   └── utils/
│
├── tests/
│
├── requirements.txt
├── Dockerfile
└── .env.example
```

---

# 10. Architecture Frontend

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── hosts.ts
│   │   ├── flows.ts
│   │   ├── domains.ts
│   │   └── dashboard.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── data-table/
│   │   ├── filters/
│   │   ├── charts/
│   │   └── ui/
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── NavigationHistory.tsx
│   │   ├── Hosts.tsx
│   │   ├── HostDetails.tsx
│   │   ├── Domains.tsx
│   │   ├── DomainDetails.tsx
│   │   ├── Flows.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── vite.config.ts
└── Dockerfile
```

---

# 11. Client ntopng

Créer un client dédié :

```text
backend/app/clients/ntopng_client.py
```

Le client est responsable exclusivement de la communication avec ntopng.

Responsabilités :

- Authentification.
- Gestion des sessions.
- Requêtes HTTP.
- Timeouts.
- Retry contrôlé.
- Gestion des erreurs.
- Validation des réponses.
- Logging technique.

Le client ne doit PAS contenir de logique métier complexe.

Exemple conceptuel :

```python
class NtopngClient:

    async def get_interfaces(self):
        pass

    async def get_hosts(self):
        pass

    async def get_host(self, host_id: str):
        pass

    async def get_flows(self, filters: dict):
        pass

    async def get_statistics(self):
        pass
```

Les méthodes finales doivent dépendre uniquement des endpoints réellement validés.

---

# 12. Couche Service

Aucune route FastAPI ne doit appeler directement ntopng.

Architecture obligatoire :

```text
Route API
    |
    v
Service
    |
    v
NtopngClient
    |
    v
ntopng
```

Exemple :

```text
GET /api/v1/hosts
        |
        v
HostService
        |
        v
NtopngClient
        |
        v
ntopng API
```

---

# 13. Normalisation des données

Les réponses brutes de ntopng ne doivent jamais être retournées directement au frontend.

Créer des schémas Pydantic.

Exemple :

```python
class NavigationRecord(BaseModel):

    timestamp: datetime | None

    local_ip: str | None
    local_hostname: str | None
    local_mac: str | None

    remote_ip: str | None

    domain: str | None

    protocol: str | None
    application: str | None

    bytes_sent: int | None
    bytes_received: int | None

    duration: float | None
```

Le backend doit :

```text
Réponse ntopng brute
        |
        v
Transformation
        |
        v
Normalisation
        |
        v
Pydantic Schema
        |
        v
Frontend
```

---

# 14. Fonctionnalités

## 14.1 Dashboard

Créer un dashboard affichant, uniquement selon les données réellement disponibles :

- Nombre de machines.
- Nombre de connexions.
- Nombre de flows.
- Volume total de trafic.
- Upload.
- Download.
- Top machines.
- Top domaines.
- Top applications.
- Top protocoles.
- Activité réseau dans le temps.

Filtres globaux :

```text
Aujourd'hui
24 heures
7 jours
30 jours
Période personnalisée
```

---

## 14.2 Historique de navigation

Créer une page :

```text
Historique de navigation
```

Cette page doit afficher les données disponibles permettant de retracer l'activité réseau.

Colonnes possibles selon disponibilité :

| Date/Heure | IP Locale | Hostname | Domaine | IP distante | Protocole | Application | Upload | Download |
|---|---|---|---|---|---|---|---|---|

Fonctionnalités :

- Pagination.
- Tri.
- Recherche.
- Filtres.
- Sélection des colonnes.
- Export.

---

## 14.3 Machines locales

Page :

```text
Machines
```

Afficher :

| IP Locale | Hostname | MAC Address | Dernière activité | Volume |
|---|---|---|---|---|

Cliquer sur une machine ouvre une page détaillée.

---

## 14.4 Détails machine

Afficher :

```text
Adresse IP
Hostname
Adresse MAC
```

Puis selon les données disponibles :

- Historique réseau.
- Domaines contactés.
- IP distantes.
- Applications.
- Protocoles.
- Volume consommé.
- Upload.
- Download.
- Activité dans le temps.

---

## 14.5 Domaines

Créer une page :

```text
Domaines visités
```

Afficher uniquement les domaines réellement détectés par ntopng.

Table :

| Domaine | Machines | Connexions | Volume | Dernière activité |
|---|---|---|---|---|

Filtres :

- Domaine.
- Adresse IP locale.
- Date.
- Application.

---

## 14.6 Flows réseau

Créer une page :

```text
Connexions / Flows
```

Colonnes possibles :

```text
Timestamp
IP Source
Port Source
IP Destination
Port Destination
Protocol
Application
Duration
Bytes
Domain
```

---

# 15. Recherche et filtres

Les filtres doivent être appliqués côté backend lorsque cela est possible.

Filtres :

```text
date_from
date_to

local_ip
remote_ip

hostname

domain

protocol

application

interface_id
```

Les filtres doivent être combinables.

---

# 16. Pagination

La pagination est obligatoire.

Paramètres standards :

```text
page
page_size
```

Valeurs :

```text
page = 1 par défaut

page_size = 50 par défaut

page_size maximum = 500
```

Ne jamais charger des milliers ou millions de records en mémoire pour afficher une page.

---

# 17. Export

Formats obligatoires :

- CSV.
- Excel (.xlsx).

Format optionnel :

- JSON.

Exports :

```text
Export historique
Export machine
Export domaine
Export flows
```

## Règle

L'export doit respecter les filtres actifs.

Exemple :

```text
IP Locale = 192.168.1.25
Date = 01/09/2026 → 03/09/2026
Domain = google.com
```

L'export doit uniquement contenir les données correspondantes.

---

# 18. API FastAPI

Préfixe :

```text
/api/v1
```

---

## Dashboard

```http
GET /api/v1/dashboard
```

---

## Hosts

```http
GET /api/v1/hosts
```

```http
GET /api/v1/hosts/{identifier}
```

```http
GET /api/v1/hosts/{identifier}/activity
```

---

## Navigation

```http
GET /api/v1/navigation
```

---

## Domains

```http
GET /api/v1/domains
```

```http
GET /api/v1/domains/{domain}
```

```http
GET /api/v1/domains/{domain}/activity
```

---

## Flows

```http
GET /api/v1/flows
```

---

## Export

```http
GET /api/v1/export/navigation/csv
```

```http
GET /api/v1/export/navigation/xlsx
```

```http
GET /api/v1/export/flows/csv
```

```http
GET /api/v1/export/flows/xlsx
```

Les endpoints peuvent être ajustés selon les résultats de la Phase 0.

---

# 19. Configuration

Créer :

```text
.env.example
```

Exemple :

```env
APP_NAME=ntopng-history-viewer

ENVIRONMENT=development

API_V1_PREFIX=/api/v1

NTOPNG_BASE_URL=http://192.168.1.1:3000

NTOPNG_USERNAME=
NTOPNG_PASSWORD=

NTOPNG_API_KEY=

NTOPNG_VERIFY_SSL=false

NTOPNG_INTERFACE_ID=1

REDIS_URL=redis://redis:6379/0

JWT_SECRET_KEY=change_this_secret
JWT_ALGORITHM=HS256

JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Règles

Ne jamais :

- Hardcoder une IP.
- Hardcoder un mot de passe.
- Hardcoder une API key.
- Commit le fichier `.env`.

---

# 20. Sécurité

Les données de navigation sont sensibles.

Respecter les règles suivantes.

## Secrets

Les secrets doivent uniquement être accessibles côté backend.

Ne jamais envoyer au frontend :

```text
NTOPNG_USERNAME
NTOPNG_PASSWORD
NTOPNG_API_KEY
JWT_SECRET_KEY
```

---

## Logs

Ne jamais logger :

- Mots de passe.
- Tokens.
- Cookies de session.
- API keys.
- Headers d'authentification.

---

## Réseau

Le port ntopng :

```text
3000
```

ne doit pas être exposé publiquement sur Internet uniquement pour cette application.

La communication recommandée :

```text
FastAPI
    |
    | Réseau local / VPN
    v
pfSense:3000
```

---

# 21. Gestion des erreurs

Toutes les erreurs doivent être normalisées.

Format API :

```json
{
    "detail": "Unable to connect to ntopng",
    "error_code": "NTOPNG_CONNECTION_ERROR"
}
```

Codes recommandés :

```text
NTOPNG_CONNECTION_ERROR
NTOPNG_TIMEOUT
NTOPNG_AUTH_ERROR
NTOPNG_API_ERROR
NTOPNG_DATA_ERROR

EXPORT_ERROR

VALIDATION_ERROR

INTERNAL_ERROR
```

---

# 22. Gestion des performances

## Principes obligatoires

Ne jamais :

- Charger tout l'historique sans pagination.
- Télécharger toutes les données ntopng pour faire un simple filtre.
- Stocker inutilement toutes les données en mémoire.
- Faire plusieurs appels identiques à ntopng dans une même requête.

---

## Cache

Redis peut être utilisé pour :

- Dashboard.
- Statistiques.
- Top hosts.
- Top domaines.

TTL recommandé :

```text
30 secondes à 5 minutes
```

Les exports ne doivent pas être mis en cache.

---

# 23. Base de données locale

Par défaut, l'application ne doit PAS créer une copie complète des données ntopng.

ntopng reste la source principale.

Une base locale peut être ajoutée ultérieurement uniquement pour :

- Utilisateurs.
- Rôles.
- Paramètres applicatifs.
- Logs d'audit.
- Historique des exports.
- Préférences utilisateur.

Toute synchronisation des données ntopng vers une base locale doit être explicitement validée avant implémentation.

---

# 24. Authentification application

Prévoir une authentification indépendante de ntopng.

Technologie recommandée :

```text
JWT
```

Rôles :

```text
admin
analyst
viewer
```

Permissions :

## admin

- Accès complet.
- Configuration ntopng.
- Gestion utilisateurs.
- Export.

## analyst

- Consultation.
- Recherche.
- Analyse.
- Export.

## viewer

- Consultation uniquement.

---

# 25. Interface utilisateur

Créer une interface professionnelle orientée administration réseau.

Menu :

```text
Dashboard

Navigation
├── Historique
├── Domaines
├── Connexions

Réseau
├── Machines
├── Interfaces

Exports

Administration
├── Utilisateurs
└── Configuration
```

---

# 26. Data Tables

Utiliser TanStack Table.

Fonctionnalités obligatoires :

- Pagination.
- Tri.
- Filtres.
- Recherche.
- Colonnes configurables.
- Export.
- État de chargement.
- Gestion des erreurs.
- État vide.

Les colonnes techniques doivent utiliser un affichage adapté :

```text
IP Address → monospace
MAC Address → monospace
Ports → monospace
```

---

# 27. Graphiques

Utiliser Recharts.

Graphiques possibles selon les données disponibles :

- Trafic dans le temps.
- Top machines.
- Top domaines.
- Top applications.
- Répartition des protocoles.
- Upload vs Download.

Ne jamais afficher un graphique avec des données inventées ou calculées à partir d'informations incomplètes.

---

# 28. Docker

Créer :

```text
docker-compose.yml
```

Services :

```text
backend
frontend
redis
```

Exemple d'architecture :

```text
docker-compose
│
├── frontend
│   └── React build + Nginx
│
├── backend
│   └── FastAPI + Uvicorn
│
└── redis
    └── Cache
```

Redis doit être optionnel si aucune fonctionnalité ne le nécessite immédiatement.

---

# 29. Tests

## Backend

Utiliser :

```text
pytest
pytest-asyncio
httpx
```

Tests obligatoires :

- Client ntopng avec réponses mockées.
- Services.
- Validation des données.
- Filtres.
- Pagination.
- Gestion des erreurs.
- Exports CSV.
- Exports Excel.

---

## Frontend

Utiliser :

```text
Vitest
React Testing Library
```

Tester au minimum :

- Data tables.
- Filtres.
- États loading.
- États error.
- Pages principales.

---

# 30. Convention de code Python

Respecter :

- PEP8.
- Type hints obligatoires.
- Pydantic v2.
- Async pour les appels HTTP.
- Séparation des responsabilités.
- Fonctions courtes.
- Pas de logique métier dans les routes.

Exemple :

```python
async def get_hosts(
    service: HostService,
) -> HostListResponse:
    return await service.get_hosts()
```

---

# 31. Convention React

Utiliser :

- TypeScript strict.
- Functional Components.
- Custom Hooks.
- TanStack Query.
- Composants réutilisables.

Interdictions :

```text
any
API calls directement dans les composants
Composants de plusieurs milliers de lignes
Duplication de logique
```

---

# 32. Workflow obligatoire Claude Code

Claude Code doit respecter strictement cet ordre.

## Étape 1

Analyser le projet existant.

Ne jamais écraser ou restructurer le projet sans vérifier les fichiers existants.

---

## Étape 2

Lire :

```text
CLAUDE.md
README.md
docker-compose.yml
.env.example
```

si ces fichiers existent.

---

## Étape 3

Réaliser la PHASE 0 :

```text
NTOPNG API DISCOVERY
```

Avant tout développement fonctionnel dépendant de ntopng.

---

## Étape 4

Documenter les résultats.

Créer :

```text
docs/ntopng-api-discovery.md
```

Ce document doit contenir :

```text
Version ntopng
Méthode d'authentification
URL testée
Endpoints validés
Réponses observées
Limitations
Données disponibles
Données indisponibles
```

---

## Étape 5

Créer ou adapter le client ntopng.

---

## Étape 6

Tester le client indépendamment.

---

## Étape 7

Créer les services métier.

---

## Étape 8

Créer les endpoints FastAPI.

---

## Étape 9

Tester l'API backend.

---

## Étape 10

Seulement après validation du backend :

```text
Développer le frontend React.
```

---

# 33. Interdictions strictes pour Claude Code

Claude Code ne doit jamais :

### 1. Inventer une API

Ne jamais écrire :

```text
/api/v2/get_historical_domains
```

si cet endpoint ntopng n'a pas été validé.

---

### 2. Inventer des données

Ne jamais créer de fausses données en production.

Les mocks sont autorisés uniquement pour :

```text
Tests
Développement local
```

Les mocks doivent être clairement identifiés.

---

### 3. Contourner la couche Backend

Interdit :

```text
React → ntopng directement
```

Obligatoire :

```text
React → FastAPI → ntopng
```

---

### 4. Hardcoder les secrets

Interdit :

```python
password = "admin123"
```

Utiliser les variables d'environnement.

---

### 5. Modifier pfSense automatiquement

L'application ne doit jamais modifier :

- La configuration pfSense.
- Les règles Firewall.
- La configuration ntopng.

Sans validation explicite.

---

### 6. Ajouter une base de données inutile

Ne pas ajouter PostgreSQL ou une autre base de données uniquement par habitude.

La base de données doit répondre à un besoin réel.

---

### 7. Commencer le frontend trop tôt

Le frontend dépend des données réellement disponibles.

Donc :

```text
Pas de développement final du frontend
avant validation de l'API ntopng.
```

---

### 8. Réécrire le projet sans nécessité

Avant toute modification importante :

- Analyser les fichiers existants.
- Identifier les dépendances.
- Identifier les impacts.
- Préserver l'architecture fonctionnelle.

---

# 34. Gestion des changements

Avant une modification importante :

1. Identifier les fichiers concernés.
2. Expliquer brièvement l'objectif technique.
3. Modifier uniquement les fichiers nécessaires.
4. Tester après modification.
5. Vérifier qu'aucune régression n'a été introduite.

Ne pas modifier simultanément backend, frontend et infrastructure sans raison.

---

# 35. Documentation obligatoire

Maintenir :

```text
README.md
docs/ntopng-api-discovery.md
docs/architecture.md
```

Le README doit contenir :

- Présentation.
- Installation.
- Configuration.
- Variables d'environnement.
- Docker.
- Lancement.
- Tests.

---

# 36. Roadmap

## Phase 0 — API Discovery

Priorité absolue.

```text
Tester ntopng
Identifier version
Tester authentification
Découvrir endpoints
Valider données
Documenter résultats
```

---

## Phase 1 — Backend Foundation

Créer :

```text
FastAPI
Configuration
Logging
Healthcheck
NtopngClient
```

---

## Phase 2 — API ntopng Integration

Développer uniquement les fonctionnalités validées :

```text
Interfaces
Hosts
Flows
Domains
Statistics
```

---

## Phase 3 — API interne

Créer :

```text
/api/v1/dashboard
/api/v1/hosts
/api/v1/flows
/api/v1/domains
/api/v1/navigation
```

Selon les capacités réellement disponibles.

---

## Phase 4 — Frontend

Créer :

```text
Layout
Dashboard
Tables
Filtres
Recherche
Détails machine
Domaines
Flows
```

---

## Phase 5 — Export

Ajouter :

```text
CSV
Excel
```

---

## Phase 6 — Authentification

Ajouter :

```text
JWT
Users
Roles
Permissions
```

---

## Phase 7 — Optimisation

Ajouter si nécessaire :

```text
Redis
Cache
Optimisation requêtes
Monitoring
Audit logs
```

---

# 37. Définition du succès

Le projet est considéré comme fonctionnel lorsque :

1. FastAPI peut communiquer avec ntopng sur pfSense.
2. Les données réellement disponibles sont correctement récupérées.
3. Les données sont normalisées.
4. Les machines locales sont consultables.
5. Les activités réseau disponibles sont consultables.
6. Les domaines détectés sont consultables.
7. Les filtres fonctionnent.
8. La pagination fonctionne.
9. Les exports CSV fonctionnent.
10. Les exports Excel fonctionnent.
11. Les erreurs ntopng sont correctement gérées.
12. Aucun secret n'est exposé au frontend.
13. Le frontend ne communique jamais directement avec ntopng.

---

# 38. Philosophie générale

L'application ne doit pas chercher à remplacer ntopng.

ntopng reste responsable de :

```text
Capture
Inspection
Analyse réseau
Classification
Détection des applications
Stockage disponible
```

L'application développée est responsable de :

```text
Centralisation
Simplification
Recherche
Filtrage
Visualisation
Analyse métier
Statistiques
Export
Gestion des utilisateurs
```

Architecture finale :

```text
                    +----------------+
                    |     pfSense    |
                    |                |
                    |     ntopng     |
                    |   IP:3000      |
                    +----------------+
                             |
                             | REST API
                             v
                    +----------------+
                    |    FastAPI     |
                    |                |
                    | Normalisation  |
                    | Services       |
                    | Export         |
                    +----------------+
                             |
                             | API / JSON
                             v
                    +----------------+
                    |     React      |
                    |                |
                    | Dashboard      |
                    | Tables         |
                    | Filtres        |
                    | Graphiques     |
                    +----------------+
```

---

# 39. Instruction finale pour Claude Code

Toujours privilégier :

```text
Validation > Supposition

Données réelles > Données inventées

Backend testé > Frontend prématuré

Architecture simple > Complexité inutile

Sécurité > Rapidité

Modification ciblée > Réécriture massive
```

## Règle absolue

Avant toute fonctionnalité dépendant de ntopng :

```text
Vérifier d'abord ce que l'instance ntopng sur pfSense expose réellement.
```

Ne jamais construire une fonctionnalité basée uniquement sur une supposition concernant l'API ntopng.