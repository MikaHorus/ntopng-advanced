# Nouvelle fonctionnalité — Consommation de bande passante

## Objectif

Ajouter un nouveau menu dans l'application permettant de visualiser et analyser la consommation de bande passante de chaque appareil connecté au réseau.

Cette fonctionnalité doit permettre de répondre aux questions suivantes :

- Quels appareils consomment le plus de bande passante ?
- Quelle quantité de données un appareil a-t-il téléchargée ?
- Quelle quantité de données un appareil a-t-il envoyée ?
- Quels appareils utilisent actuellement le plus le réseau ?
- Quels domaines sont les plus fréquemment visités par un appareil ?
- Quelles sont les principales destinations réseau d'un appareil ?

Les données doivent être récupérées principalement depuis ntopng via son API REST.

---

# 1. Nouveau menu

Ajouter un nouveau menu dans la barre de navigation :

```text
Dashboard
Historique
Machines
Flows actifs
Domaines
Consommation de bande passante
```

Créer une page dédiée :

```text
/bandwidth-consumption
```

Composant React recommandé :

```text
BandwidthConsumption.tsx
```

Chaque menu principal doit continuer à correspondre à une page indépendante.

---

# 2. Page Consommation de bande passante

## Objectif de la page

Cette page doit afficher la liste de tous les appareils détectés sur le réseau avec leur consommation de bande passante.

Les données doivent être présentées sous forme de tableau.

---

# 3. Tableau principal

Le tableau doit afficher au minimum les colonnes suivantes :

| Appareil | Adresse IP | Adresse MAC | Upload | Download | Total |
|---|---|---|---:|---:|---:|

Exemple :

| Appareil | IP locale | MAC | Upload | Download | Total |
|---|---|---|---:|---:|---:|
| PC-BUREAU-01 | 192.168.1.10 | AA:BB:CC:DD:EE:01 | 2.4 GB | 15.8 GB | 18.2 GB |
| LAPTOP-USER | 192.168.1.25 | AA:BB:CC:DD:EE:02 | 1.2 GB | 8.6 GB | 9.8 GB |
| TELEPHONE-01 | 192.168.1.40 | AA:BB:CC:DD:EE:03 | 500 MB | 4.1 GB | 4.6 GB |

---

# 4. Informations affichées pour chaque appareil

Chaque ligne doit afficher :

```text
Nom de l'appareil / Hostname
Adresse IP locale
Adresse MAC
Bande passante Upload
Bande passante Download
Consommation totale
Dernière activité
```

Si certaines informations ne sont pas disponibles depuis ntopng, afficher une valeur appropriée :

```text
Inconnu
Non disponible
-
```

Ne jamais inventer une donnée.

---

# 5. Calcul de la consommation totale

La consommation totale doit être calculée comme suit :

```text
Total = Upload + Download
```

Les unités doivent être automatiquement formatées.

Exemples :

```text
850 KB
15.4 MB
2.8 GB
1.2 TB
```

Ne pas afficher des nombres bruts en octets dans l'interface utilisateur.

---

# 6. Tri du tableau

Le tableau doit permettre de trier les appareils selon :

```text
Consommation totale
Download
Upload
Nom de l'appareil
Adresse IP
```

Par défaut, afficher les appareils du plus gros consommateur au plus petit :

```text
ORDER BY consommation_totale DESC
```

ou l'équivalent côté frontend/API selon la source des données.

---

# 7. Filtres et recherche

Ajouter une zone de recherche permettant de rechercher un appareil par :

```text
Adresse IP
Nom d'hôte
Adresse MAC
```

Exemple :

```text
Rechercher un appareil...
```

Prévoir également un filtre permettant de choisir la période de consommation.

Exemple :

```text
Aujourd'hui

Dernières 24 heures

7 derniers jours

30 derniers jours

Période personnalisée
```

## Important

Les périodes disponibles doivent dépendre des capacités réelles de ntopng et des données disponibles.

Ne pas afficher une fonctionnalité comme opérationnelle si ntopng ne fournit pas les données nécessaires.

---

# 8. Pagination

Si le nombre d'appareils est important, ajouter une pagination.

Paramètres recommandés :

```text
page
page_size
```

Valeur par défaut :

```text
page_size = 50
```

Maximum recommandé :

```text
page_size = 100
```

---

# 9. Cliquer sur un appareil

Chaque ligne du tableau doit être cliquable.

Lorsqu'un utilisateur clique sur un appareil, il doit accéder à une page de détail dédiée.

Route recommandée :

```text
/bandwidth-consumption/:deviceId
```

ou, selon l'identifiant réellement disponible :

```text
/bandwidth-consumption/:ip
```

## Important

Ne pas utiliser uniquement l'adresse IP comme identifiant permanent si elle est attribuée dynamiquement par DHCP.

Privilégier :

```text
MAC Address
ntopng Host ID
```

si ces informations sont disponibles.

---

# 10. Page détail d'un appareil

Créer une page :

```text
DeviceBandwidthDetails.tsx
```

Cette page doit permettre d'analyser en détail la consommation réseau d'un appareil.

---

# 11. Informations générales de l'appareil

Afficher en haut de la page :

```text
Nom de l'appareil

Adresse IP

Adresse MAC

Fabricant (si disponible)

Dernière activité

Statut
```

Exemple :

```text
PC-BUREAU-01

IP :
192.168.1.25

MAC :
AA:BB:CC:DD:EE:FF

Dernière activité :
04/09/2026 16:45
```

---

# 12. Résumé de consommation

Afficher des cartes de statistiques :

```text
┌─────────────────────┐
│ Upload              │
│ 2.4 GB              │
└─────────────────────┘

┌─────────────────────┐
│ Download            │
│ 15.8 GB             │
└─────────────────────┘

┌─────────────────────┐
│ Total               │
│ 18.2 GB             │
└─────────────────────┘
```

---

# 13. Graphique de consommation

Ajouter un graphique permettant de visualiser la consommation dans le temps.

Exemple :

```text
Consommation réseau
│
│                Download
│             /──────────
│         /───
│     /──
│____/____________________
│
└─────────────────────────
     Temps
```

Le graphique doit idéalement afficher :

```text
Upload

Download
```

sur une période sélectionnée.

Périodes possibles :

```text
1 heure
24 heures
7 jours
30 jours
```

La disponibilité réelle dépend des données fournies par ntopng.

---

# 14. Domaines les plus visités

Ajouter une section importante :

```text
Domaines les plus visités
```

Cette section doit afficher les domaines les plus fréquemment visités par l'appareil.

Exemple :

| Domaine | Nombre de visites | Volume échangé |
|---|---:|---:|
| google.com | 450 | 2.1 GB |
| youtube.com | 320 | 8.4 GB |
| facebook.com | 120 | 1.2 GB |

Les données doivent être récupérées depuis :

```text
PostgreSQL
```

si l'historique de navigation est déjà stocké dans la base de données.

Cela permettra de conserver les statistiques même si ntopng ne conserve plus certaines données.

---

# 15. Classement des domaines

Les domaines peuvent être classés selon :

```text
Nombre de visites

Volume de données

Nombre de connexions
```

Prévoir une structure permettant d'ajouter plusieurs modes de classement.

Par défaut :

```text
Nombre de visites DESC
```

---

# 16. Principales destinations réseau

Ajouter une section :

```text
Principales destinations réseau
```

Exemple :

| Destination | IP distante | Upload | Download |
|---|---|---:|---:|
| Google | 142.250.x.x | 200 MB | 1.5 GB |
| Cloudflare | 104.x.x.x | 50 MB | 400 MB |

Cette section dépend des informations disponibles depuis ntopng.

---

# 17. Répartition de la consommation

Ajouter éventuellement une visualisation permettant de comprendre comment la bande passante est utilisée.

Exemples de catégories :

```text
Web

Streaming

Réseaux sociaux

Cloud

Téléchargements

Autres
```

## Important

Ces catégories doivent uniquement être utilisées si ntopng fournit les informations nécessaires.

Ne pas essayer de deviner la catégorie à partir du nom d'un domaine sans logique clairement définie.

---

# 18. Architecture Backend

Créer ou adapter un module dédié.

Structure recommandée :

```text
backend/
├── app/
│   ├── routers/
│   │   └── bandwidth.py
│   │
│   ├── services/
│   │   ├── bandwidth_service.py
│   │   └── device_analytics_service.py
│   │
│   ├── clients/
│   │   └── ntopng_client.py
│   │
│   └── schemas/
│       └── bandwidth.py
```

---

# 19. API Backend

Créer les endpoints nécessaires.

## Liste des consommations

```http
GET /api/v1/bandwidth/devices
```

Paramètres possibles :

```text
page
page_size

search

period

sort_by
sort_order
```

Exemple :

```http
GET /api/v1/bandwidth/devices?page=1&page_size=50&period=24h&sort_by=total&sort_order=desc
```

---

# 20. Réponse API — Liste des appareils

Exemple :

```json
{
    "items": [
        {
            "id": "device-001",
            "hostname": "PC-BUREAU-01",
            "local_ip": "192.168.1.10",
            "mac_address": "AA:BB:CC:DD:EE:01",
            "upload_bytes": 2576980377,
            "download_bytes": 16965120819,
            "total_bytes": 19542001196,
            "last_seen": "2026-09-04T16:45:00"
        }
    ],
    "page": 1,
    "page_size": 50,
    "total": 25,
    "total_pages": 1
}
```

Le frontend doit convertir les octets en unités lisibles.

---

# 21. API — Détail d'un appareil

Créer un endpoint :

```http
GET /api/v1/bandwidth/devices/{device_id}
```

Réponse possible :

```json
{
    "device": {
        "id": "device-001",
        "hostname": "PC-BUREAU-01",
        "local_ip": "192.168.1.10",
        "mac_address": "AA:BB:CC:DD:EE:01"
    },
    "consumption": {
        "upload_bytes": 2576980377,
        "download_bytes": 16965120819,
        "total_bytes": 19542001196
    }
}
```

---

# 22. API — Évolution de la consommation

Créer un endpoint dédié :

```http
GET /api/v1/bandwidth/devices/{device_id}/usage
```

Paramètres :

```text
period
date_from
date_to
```

Cet endpoint doit fournir les données nécessaires pour les graphiques.

---

# 23. API — Domaines les plus visités

Créer un endpoint :

```http
GET /api/v1/bandwidth/devices/{device_id}/top-domains
```

Paramètres possibles :

```text
period
limit
```

Exemple :

```http
GET /api/v1/bandwidth/devices/device-001/top-domains?period=7d&limit=10
```

---

# 24. Source des données

La source des données doit être clairement séparée selon le type d'information.

## ntopng

Utiliser ntopng pour :

```text
Appareils connectés

Hosts

Trafic réseau

Upload

Download

Flows actifs

Destinations réseau

Statistiques temps réel
```

## PostgreSQL

Utiliser PostgreSQL pour :

```text
Historique de navigation

Domaines visités

Nombre de visites

Statistiques historiques

Analyses sur plusieurs jours
```

Architecture :

```text
                    +------------------+
                    |      ntopng      |
                    |      pfSense     |
                    +------------------+
                            |
                 Données réseau temps réel
                            |
                            v
                    +------------------+
                    |     FastAPI      |
                    +------------------+
                      |             |
                      |             |
                      v             v
              +-----------+    +-----------+
              | PostgreSQL|    |   React   |
              | Historique|    | Interface |
              +-----------+    +-----------+
```

---

# 25. Identification des appareils

## Important

Un appareil peut changer d'adresse IP.

Le système ne doit donc pas considérer uniquement l'adresse IP comme identité permanente.

Utiliser en priorité :

```text
Adresse MAC
```

ou :

```text
Identifiant unique ntopng
```

L'adresse IP peut être affichée comme information actuelle.

---

# 26. Cas d'un appareil avec plusieurs IP

Prévoir que :

```text
Une adresse MAC
↓
Peut avoir plusieurs adresses IP dans le temps
```

L'historique doit rester associé à l'appareil lorsque cela est techniquement possible.

---

# 27. Page Frontend

Créer les composants suivants :

```text
pages/
├── BandwidthConsumption.tsx
└── DeviceBandwidthDetails.tsx
```

Composants recommandés :

```text
components/
└── bandwidth/
    ├── BandwidthTable.tsx
    ├── BandwidthSummaryCards.tsx
    ├── DeviceConsumptionChart.tsx
    ├── TopDomains.tsx
    ├── TopDestinations.tsx
    └── BandwidthFilters.tsx
```

---

# 28. Navigation

Ajouter le nouveau menu :

```text
Consommation de bande passante
```

Route :

```text
/bandwidth-consumption
```

La barre de navigation doit rester fixe conformément aux règles précédentes.

Le nouveau menu doit être intégré au layout global.

---

# 29. Design recommandé

La page principale doit être organisée ainsi :

```text
┌─────────────────────────────────────────────────────────────┐
│ Consommation de bande passante                              │
│                                                             │
│ [Recherche appareil] [Période ▼]                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Appareil     IP        Upload    Download       Total       │
│                                                             │
│ PC-01        192...    2.4 GB    15.8 GB        18.2 GB     │
│ PC-02        192...    1.2 GB    8.6 GB         9.8 GB      │
│ Phone-01     192...    500 MB    4.1 GB         4.6 GB      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 30. Design page détail

```text
┌─────────────────────────────────────────────────────────────┐
│ ← Retour                                                   │
│                                                             │
│ PC-BUREAU-01                                                │
│ 192.168.1.25                                               │
│                                                             │
├──────────────┬──────────────┬───────────────────────────────┤
│ Upload       │ Download     │ Total                         │
│ 2.4 GB       │ 15.8 GB      │ 18.2 GB                      │
└──────────────┴──────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Évolution de la consommation                                │
│                                                             │
│                    [ Graphique ]                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────┐
│ Domaines les plus visités│ Principales destinations réseau │
│                          │                                  │
│ google.com               │ Google                           │
│ youtube.com              │ Cloudflare                       │
│ facebook.com             │ Microsoft                        │
└──────────────────────────┴──────────────────────────────────┘
```

---

# 31. Performance

Cette fonctionnalité doit être optimisée.

Règles obligatoires :

1. Ne pas récupérer inutilement toutes les données ntopng.
2. Utiliser la pagination pour les listes.
3. Limiter les requêtes API.
4. Mettre en cache les données lorsque cela est pertinent.
5. Ne pas recalculer des statistiques lourdes à chaque requête.
6. Réutiliser les données PostgreSQL pour les analyses historiques.
7. Éviter les requêtes N+1.
8. Charger les graphiques uniquement lorsque nécessaire.

---

# 32. Gestion des erreurs

Prévoir les cas suivants :

```text
ntopng indisponible

API ntopng inaccessible

Aucune donnée disponible

Appareil introuvable

Données historiques insuffisantes
```

L'application doit afficher un message clair à l'utilisateur.

Ne pas afficher une erreur technique brute provenant de FastAPI ou ntopng.

---

# 33. Règles strictes

Claude Code ne doit pas :

- Inventer des statistiques non fournies par ntopng ou PostgreSQL.
- Utiliser uniquement l'adresse IP comme identifiant permanent d'un appareil.
- Charger toutes les données réseau simultanément.
- Casser les fonctionnalités existantes.
- Mélanger cette fonctionnalité avec la page Machines.
- Dupliquer inutilement les appels API.
- Calculer de grosses statistiques en mémoire lorsque PostgreSQL peut les calculer.
- Exposer directement les identifiants ou l'API ntopng au frontend.

---

# 34. Ordre de développement obligatoire

## Étape 1

Analyser les données réellement disponibles depuis l'API REST ntopng.

Identifier précisément :

```text
Hosts

Host ID

MAC Address

Upload bytes

Download bytes

Total bytes

Traffic statistics

Historical statistics

Destinations
```

Ne pas commencer l'implémentation en supposant la structure de l'API.

---

## Étape 2

Créer un service backend dédié à la consommation de bande passante.

---

## Étape 3

Créer l'endpoint de liste des appareils avec leur consommation.

---

## Étape 4

Créer la page :

```text
/bandwidth-consumption
```

---

## Étape 5

Ajouter le tri, la recherche et la pagination.

---

## Étape 6

Créer la page de détail d'un appareil.

---

## Étape 7

Ajouter les statistiques détaillées :

```text
Upload

Download

Total

Graphique d'évolution
```

---

## Étape 8

Connecter les données PostgreSQL pour :

```text
Domaines les plus visités

Historique de navigation

Statistiques par domaine
```

---

## Étape 9

Tester les performances et les erreurs.

---

# Résultat final attendu

L'application doit disposer d'un nouveau module :

```text
Consommation de bande passante
```

L'utilisateur doit pouvoir :

```text
✓ Voir tous les appareils connectés.

✓ Voir leur consommation Upload.

✓ Voir leur consommation Download.

✓ Voir leur consommation totale.

✓ Trier les appareils selon leur consommation.

✓ Rechercher un appareil.

✓ Cliquer sur un appareil.

✓ Accéder à une page détaillée.

✓ Voir l'évolution de sa consommation.

✓ Identifier les domaines les plus visités.

✓ Identifier les principales destinations réseau.
```

---

# Vision fonctionnelle finale

```text
Application
│
├── Dashboard
│
├── Historique
│   └── Historique de navigation PostgreSQL
│
├── Machines
│   └── Liste des appareils détectés
│
├── Flows actifs
│   └── Connexions réseau en temps réel
│
├── Domaines
│   └── Analyse des domaines
│
└── Consommation de bande passante
    │
    ├── Liste des appareils
    │   ├── Upload
    │   ├── Download
    │   └── Total
    │
    └── Détail appareil
        ├── Consommation détaillée
        ├── Graphique
        ├── Domaines les plus visités
        └── Principales destinations réseau
```