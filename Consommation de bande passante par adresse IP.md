# Évolution — Analyse de la consommation par adresse IP locale

## Objectif

Modifier et enrichir la fonctionnalité **Consommation de bande passante** afin d'afficher les adresses IP locales des appareils et de permettre une analyse détaillée de la consommation réseau pour chaque adresse IP.

L'utilisateur doit pouvoir cliquer sur une adresse IP locale afin d'afficher :

- Tous les domaines visités par cette adresse IP.
- La quantité de bande passante consommée pour chaque domaine.
- Le volume Upload.
- Le volume Download.
- La consommation totale.
- Le nombre de connexions ou visites.
- La dernière activité détectée.

---

# 1. Modification de la page Consommation de bande passante

La page principale :

```text
/bandwidth-consumption
```

doit afficher clairement les adresses IP locales.

Le tableau doit contenir au minimum :

| Appareil | Adresse IP locale | Adresse MAC | Upload | Download | Total |
|---|---|---|---:|---:|---:|

Exemple :

| Appareil | Adresse IP locale | Upload | Download | Total |
|---|---|---:|---:|---:|
| PC-BUREAU-01 | 192.168.1.10 | 2.4 GB | 15.8 GB | 18.2 GB |
| LAPTOP-USER | 192.168.1.25 | 1.2 GB | 8.6 GB | 9.8 GB |
| TELEPHONE-01 | 192.168.1.40 | 500 MB | 4.1 GB | 4.6 GB |

---

# 2. Adresse IP locale cliquable

La colonne :

```text
Adresse IP locale
```

doit être cliquable.

Exemple :

```text
192.168.1.25
```

Lorsqu'un utilisateur clique sur une adresse IP, il doit être redirigé vers une page d'analyse détaillée.

Route recommandée :

```text
/bandwidth-consumption/ip/{local_ip}
```

Exemple :

```text
/bandwidth-consumption/ip/192.168.1.25
```

---

# 3. Page de détail d'une adresse IP

Créer une nouvelle page dédiée :

```text
IpBandwidthDetails.tsx
```

Cette page doit afficher toutes les informations disponibles concernant l'activité réseau de l'adresse IP sélectionnée.

---

# 4. Informations générales

En haut de la page, afficher un résumé de l'adresse IP.

Exemple :

```text
Adresse IP : 192.168.1.25

Nom de l'appareil : LAPTOP-USER

Adresse MAC : AA:BB:CC:DD:EE:FF

Dernière activité : 04/09/2026 16:45
```

Ajouter également des cartes de statistiques :

```text
┌──────────────────┐
│ Upload           │
│ 2.4 GB           │
└──────────────────┘

┌──────────────────┐
│ Download         │
│ 15.8 GB          │
└──────────────────┘

┌──────────────────┐
│ Total            │
│ 18.2 GB          │
└──────────────────┘
```

---

# 5. Liste des domaines visités par l'adresse IP

Ajouter une section principale :

```text
Activité réseau par domaine
```

Cette section doit afficher tous les domaines associés à l'adresse IP sélectionnée.

Le tableau doit contenir :

| Domaine | Upload | Download | Total | Nombre de visites | Dernière activité |
|---|---:|---:|---:|---:|---|

Exemple :

| Domaine | Upload | Download | Total | Visites | Dernière activité |
|---|---:|---:|---:|---:|---|
| youtube.com | 300 MB | 5.8 GB | 6.1 GB | 250 | 04/09/2026 16:40 |
| google.com | 120 MB | 1.2 GB | 1.32 GB | 480 | 04/09/2026 16:45 |
| facebook.com | 80 MB | 900 MB | 980 MB | 120 | 04/09/2026 15:30 |

---

# 6. Calcul de la bande passante par domaine

Pour chaque domaine, calculer ou récupérer :

```text
Upload
+
Download
=
Consommation totale
```

La consommation totale doit être affichée de manière lisible :

```text
850 KB
15.4 MB
2.8 GB
1.2 TB
```

Ne jamais afficher directement les octets bruts dans l'interface utilisateur.

---

# 7. Source des données

La fonctionnalité doit combiner les sources de données disponibles.

## PostgreSQL

PostgreSQL doit être utilisé pour :

```text
Historique de navigation

Adresse IP locale

Domaine visité

Date et heure

Nombre de visites

Historique persistant
```

## ntopng

ntopng doit être utilisé lorsque les données sont disponibles pour :

```text
Upload

Download

Volume total

Flows

Destinations réseau
```

---

# 8. Association entre domaine et consommation de bande passante

## Important

Avant d'implémenter cette fonctionnalité, analyser les données réellement disponibles dans ntopng.

L'objectif est d'associer :

```text
Adresse IP locale
        +
Domaine
        +
Flow réseau
        ↓
Upload / Download
```

La logique doit être basée sur les données réellement fournies par ntopng.

Ne pas inventer ou estimer une consommation si aucune donnée fiable ne permet de l'associer à un domaine.

---

# 9. Cas où le domaine n'est pas disponible

Certains flux réseau peuvent ne pas être associés à un nom de domaine.

Dans ce cas :

```text
Domaine :
Non identifié
```

ou :

```text
Adresse IP distante :
XXX.XXX.XXX.XXX
```

Ne pas supprimer ces données réseau uniquement parce qu'un domaine n'est pas disponible.

---

# 10. API Backend

Créer un endpoint permettant de récupérer le détail de la consommation par adresse IP.

## Détail général

```http
GET /api/v1/bandwidth/ip/{local_ip}
```

Exemple :

```http
GET /api/v1/bandwidth/ip/192.168.1.25
```

Réponse exemple :

```json
{
    "local_ip": "192.168.1.25",
    "hostname": "LAPTOP-USER",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "upload_bytes": 2576980377,
    "download_bytes": 16965120819,
    "total_bytes": 19542001196,
    "last_seen": "2026-09-04T16:45:00"
}
```

---

# 11. API — Activité par domaine

Créer un endpoint dédié :

```http
GET /api/v1/bandwidth/ip/{local_ip}/domains
```

Paramètres :

```text
page
page_size

date_from
date_to

time_from
time_to

domain

sort_by
sort_order
```

Exemple :

```http
GET /api/v1/bandwidth/ip/192.168.1.25/domains?page=1&page_size=50&date_from=2026-09-01&date_to=2026-09-04
```

---

# 12. Réponse API — Domaines

Exemple :

```json
{
    "items": [
        {
            "domain": "youtube.com",
            "upload_bytes": 314572800,
            "download_bytes": 6227702579,
            "total_bytes": 6542275379,
            "visit_count": 250,
            "last_activity": "2026-09-04T16:40:00"
        },
        {
            "domain": "google.com",
            "upload_bytes": 125829120,
            "download_bytes": 1288490188,
            "total_bytes": 1414319308,
            "visit_count": 480,
            "last_activity": "2026-09-04T16:45:00"
        }
    ],
    "page": 1,
    "page_size": 50,
    "total": 2,
    "total_pages": 1
}
```

---

# 13. Pagination obligatoire

La liste des domaines peut devenir importante.

Ajouter une pagination côté backend.

Paramètres :

```text
page
page_size
```

Valeur recommandée :

```text
page_size = 50
```

Maximum :

```text
page_size = 100
```

Ne jamais charger tous les domaines simultanément dans le frontend.

---

# 14. Filtres sur la page de détail IP

Ajouter les filtres suivants :

```text
Domaine

Date début

Date fin

Heure début

Heure fin
```

Exemple :

```text
┌──────────────────────────────────────────────────────┐
│ Domaine       [____________________]                 │
│                                                      │
│ Date début    [____/____/________]                  │
│ Date fin      [____/____/________]                  │
│                                                      │
│ Heure début   [__:__]                               │
│ Heure fin     [__:__]                               │
│                                                      │
│ [ Réinitialiser ]           [ Rechercher ]          │
└──────────────────────────────────────────────────────┘
```

Les filtres doivent être appliqués côté backend.

---

# 15. Tri

Permettre de trier les domaines par :

```text
Consommation totale

Download

Upload

Nombre de visites

Dernière activité
```

Par défaut :

```text
Consommation totale DESC
```

Les domaines consommant le plus de bande passante doivent apparaître en premier.

---

# 16. Graphique des principaux domaines

Ajouter un graphique permettant de visualiser les domaines consommant le plus de bande passante.

Exemple conceptuel :

```text
YouTube       ████████████████████ 6.1 GB
Google        ██████               1.3 GB
Facebook      ████                 980 MB
Cloudflare    ██                   500 MB
```

Le graphique doit afficher les principaux consommateurs.

Limiter par défaut à :

```text
Top 10 domaines
```

---

# 17. Historique détaillé des visites

Sous le tableau des domaines, prévoir une section supplémentaire :

```text
Historique détaillé
```

Cette section peut afficher les événements individuels :

| Date | Heure | Domaine | Upload | Download | Total |
|---|---|---|---:|---:|---:|

Exemple :

| Date | Heure | Domaine | Upload | Download | Total |
|---|---|---:|---:|---:|---:|
| 04/09/2026 | 16:40 | youtube.com | 20 MB | 300 MB | 320 MB |
| 04/09/2026 | 16:35 | google.com | 5 MB | 50 MB | 55 MB |

## Important

Cette fonctionnalité dépend de la disponibilité réelle des données par flow.

Si ntopng ne fournit pas un historique précis par domaine avec Upload/Download, ne pas simuler les données.

---

# 18. Architecture Frontend

Créer ou adapter les composants suivants :

```text
pages/
├── BandwidthConsumption.tsx
└── IpBandwidthDetails.tsx
```

Composants :

```text
components/
└── bandwidth/
    ├── BandwidthTable.tsx
    ├── IpSummaryCards.tsx
    ├── DomainConsumptionTable.tsx
    ├── DomainConsumptionChart.tsx
    ├── IpBandwidthFilters.tsx
    └── DetailedTrafficHistory.tsx
```

---

# 19. Navigation utilisateur

Parcours attendu :

```text
Consommation de bande passante
        │
        ▼
Liste des appareils
        │
        ▼
Clic sur l'adresse IP locale
        │
        ▼
Page de détail de l'IP
        │
        ├── Résumé Upload / Download / Total
        │
        ├── Domaines visités
        │     ├── Upload
        │     ├── Download
        │     ├── Total
        │     └── Nombre de visites
        │
        ├── Graphique Top domaines
        │
        └── Historique détaillé
```

---

# 20. Performance

Respecter obligatoirement les règles suivantes :

1. Pagination côté serveur.
2. Filtres exécutés dans PostgreSQL ou directement via l'API ntopng selon la source.
3. Ne pas charger tout l'historique d'une IP en mémoire.
4. Ne pas effectuer de requêtes ntopng individuelles pour chaque domaine.
5. Éviter les requêtes N+1.
6. Utiliser des agrégations SQL (`SUM`, `COUNT`, `GROUP BY`) lorsque les données sont stockées dans PostgreSQL.
7. Limiter les graphiques aux données nécessaires.

---

# 21. Point technique important : persistance des données de bande passante

Pour permettre une analyse historique fiable par adresse IP et par domaine, prévoir éventuellement une table dédiée.

Exemple conceptuel :

```text
network_flow_history
```

Structure possible :

```text
id

timestamp

local_ip

remote_ip

domain

upload_bytes

download_bytes

total_bytes

protocol

application
```

## Attention

Ne pas créer cette table automatiquement sans vérifier que ntopng fournit réellement les données nécessaires pour alimenter ces champs.

---

# 22. Règles strictes

Claude Code ne doit pas :

- Inventer la consommation d'un domaine.
- Estimer artificiellement Upload/Download.
- Associer un domaine à une consommation sans donnée fiable.
- Utiliser uniquement le frontend pour calculer les statistiques.
- Charger toutes les données simultanément.
- Supprimer les fonctionnalités existantes.
- Casser la page Consommation de bande passante existante.

---

# 23. Ordre de développement obligatoire

## Étape 1

Analyser les données réellement disponibles depuis ntopng.

Vérifier notamment si ntopng fournit :

```text
Adresse IP locale

Flow ID

Adresse IP distante

Nom de domaine

Upload bytes

Download bytes

Total bytes
```

---

## Étape 2

Analyser la structure actuelle de PostgreSQL.

Vérifier si les données d'historique existantes peuvent déjà être utilisées.

---

## Étape 3

Modifier la liste principale afin d'afficher clairement les adresses IP locales.

---

## Étape 4

Rendre les adresses IP cliquables.

---

## Étape 5

Créer la page de détail :

```text
/bandwidth-consumption/ip/{local_ip}
```

---

## Étape 6

Créer les endpoints backend.

---

## Étape 7

Implémenter la liste des domaines avec leur consommation réelle.

---

## Étape 8

Ajouter les filtres et la pagination.

---

## Étape 9

Ajouter le graphique des principaux domaines.

---

## Étape 10

Tester avec plusieurs appareils et plusieurs adresses IP.

---

# Résultat attendu

La fonctionnalité Consommation de bande passante doit permettre :

```text
✓ Voir les appareils connectés.

✓ Voir leurs adresses IP locales.

✓ Voir Upload / Download / Total.

✓ Cliquer sur une adresse IP.

✓ Accéder à l'analyse détaillée de cette adresse IP.

✓ Voir les domaines visités par cette IP.

✓ Voir la bande passante consommée pour chaque domaine.

✓ Voir Upload / Download / Total par domaine.

✓ Voir le nombre de visites.

✓ Filtrer par période.

✓ Trier les domaines selon leur consommation.

✓ Consulter un historique détaillé lorsque les données sont disponibles.
```

---

# Architecture finale souhaitée

```text
                    Consommation de bande passante
                                │
                                ▼
                     Liste des appareils / IP
                                │
                    Clic sur une adresse IP
                                │
                                ▼
                     Analyse détaillée de l'IP
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
         Consommation      Domaines visités    Historique
         Upload/Download   par consommation    détaillé
              │                 │                  │
              ▼                 ▼                  ▼
           ntopng        PostgreSQL + ntopng    PostgreSQL
```