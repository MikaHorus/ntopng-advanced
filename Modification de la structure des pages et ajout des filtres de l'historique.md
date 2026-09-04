# Modification de la structure des pages et ajout des filtres de l'historique

## Objectif

Modifier la mise en forme et l'organisation de l'interface afin que chaque fonctionnalité principale de l'application soit affichée dans une page distincte.

L'objectif est d'avoir une navigation claire, simple et professionnelle.

Chaque menu principal doit correspondre à une route et une page React indépendante.

---

# 1. Structure des pages

Les menus suivants doivent chacun avoir leur propre page dédiée.

## Dashboard

Créer une page :

```text
/dashboard
```

Composant :

```text
Dashboard.tsx
```

Cette page doit contenir uniquement les statistiques générales et les graphiques.

Elle ne doit pas mélanger les tableaux complets d'historique ou de machines.

---

## Historique

Créer une page dédiée :

```text
/history
```

Composant :

```text
NavigationHistory.tsx
```

Cette page doit afficher exclusivement l'historique de navigation enregistré dans PostgreSQL.

Elle doit contenir :

- Le tableau des historiques.
- La pagination.
- Les filtres.
- La recherche éventuelle.

---

## Machines

Créer une page dédiée :

```text
/machines
```

Composant :

```text
Machines.tsx
```

Cette page doit afficher uniquement la liste des machines détectées.

Informations possibles :

- Adresse IP locale.
- Nom d'hôte.
- Adresse MAC.
- Dernière activité.
- Volume de trafic.

Chaque machine pourra éventuellement être cliquable pour accéder à une page de détail.

Exemple :

```text
/machines/{ip_address}
```

---

## Flows actifs

Créer une page dédiée :

```text
/active-flows
```

Composant :

```text
ActiveFlows.tsx
```

Cette page doit afficher les connexions ou flows actuellement actifs récupérés depuis ntopng.

Cette page ne doit pas afficher l'historique PostgreSQL.

Les données doivent provenir directement de ntopng.

---

## Domaines

Créer une page dédiée :

```text
/domains
```

Composant :

```text
Domains.tsx
```

Cette page doit afficher les domaines détectés ou visités selon les données disponibles.

Avant toute modification importante de cette page, analyser et corriger le problème actuel de l'onglet Domaines.

---

# 2. Structure de navigation

Le menu principal doit être organisé comme suit :

```text
Dashboard
Historique
Machines
Flows actifs
Domaines
```

Chaque élément doit rediriger vers sa propre page.

Architecture :

```text
Dashboard
    |
    └── /dashboard

Historique
    |
    └── /history

Machines
    |
    └── /machines

Flows actifs
    |
    └── /active-flows

Domaines
    |
    └── /domains
```

---

# 3. Règle importante concernant les pages

Ne pas afficher toutes les fonctionnalités dans une seule page.

Chaque page doit être indépendante.

Interdit :

```text
Une seule page Dashboard contenant :
- Historique
- Machines
- Flows
- Domaines
```

Obligatoire :

```text
Une fonctionnalité principale = une page dédiée
```

Chaque page doit avoir :

- Son propre composant.
- Sa propre route.
- Ses propres appels API.
- Son propre état de chargement.
- Sa propre gestion des erreurs.

---

# 4. Modification de la page Historique

La page :

```text
/history
```

doit afficher l'historique de navigation provenant de PostgreSQL.

---

# 5. Filtres de l'historique

Ajouter une zone de filtres au-dessus du tableau.

Les filtres suivants sont obligatoires.

## Filtre par adresse IP locale

Champ :

```text
Adresse IP
```

Permettre de rechercher par exemple :

```text
192.168.1.10
192.168.1.25
```

Le filtre doit être envoyé au backend.

---

## Filtre par domaine

Champ :

```text
Domaine
```

Exemples :

```text
google.com
youtube.com
facebook.com
```

Le système doit permettre de filtrer les historiques correspondant à un domaine.

---

## Filtre par date

Ajouter une sélection de date.

Deux possibilités :

```text
Date précise
```

ou :

```text
Date début
Date fin
```

La solution recommandée est :

```text
Date début
Date fin
```

Cela permet de filtrer une période.

Exemple :

```text
Du : 01/09/2026

Au : 04/09/2026
```

---

## Filtre par heure

Ajouter également un filtre horaire.

Deux champs recommandés :

```text
Heure début

Heure fin
```

Exemple :

```text
De : 08:00

À : 18:00
```

Cela permettra par exemple d'afficher uniquement les navigations effectuées entre 08h00 et 18h00.

---

# 6. Interface des filtres

La zone de filtres doit être placée au-dessus du tableau.

Exemple de disposition :

```text
┌───────────────────────────────────────────────────────────────┐
│                    FILTRES HISTORIQUE                         │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Adresse IP       [________________________]                   │
│                                                               │
│ Domaine          [________________________]                   │
│                                                               │
│ Date début       [____/____/________]                         │
│ Date fin         [____/____/________]                         │
│                                                               │
│ Heure début      [__:__]                                      │
│ Heure fin        [__:__]                                      │
│                                                               │
│ [ Réinitialiser ]                    [ Rechercher ]            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

Sur les écrans larges, les champs peuvent être organisés sur plusieurs colonnes pour éviter une interface trop verticale.

L'interface doit rester responsive.

---

# 7. Fonctionnement des filtres

Les filtres doivent être appliqués côté backend.

Le frontend envoie les paramètres à l'API.

Exemple :

```http
GET /api/v1/navigation-history?page=1&page_size=50&local_ip=192.168.1.25&domain=google.com&date_from=2026-09-01&date_to=2026-09-04&time_from=08:00&time_to=18:00
```

Le backend doit construire une requête PostgreSQL optimisée.

Interdiction de :

```text
Récupérer tout l'historique
↓
Charger les données en mémoire
↓
Filtrer avec Python
```

Obligatoire :

```text
Filtres SQL
↓
Pagination SQL
↓
Résultats limités
↓
Retour API
```

---

# 8. API Backend à mettre à jour

Modifier l'endpoint :

```http
GET /api/v1/navigation-history
```

Paramètres supportés :

```text
page
page_size

local_ip
domain

date_from
date_to

time_from
time_to
```

Exemple :

```text
/api/v1/navigation-history
?page=1
&page_size=50
&local_ip=192.168.1.25
&domain=google.com
&date_from=2026-09-01
&date_to=2026-09-04
&time_from=08:00
&time_to=18:00
```

---

# 9. Logique de filtrage PostgreSQL

Les filtres doivent être combinables.

Exemple :

```text
IP = 192.168.1.25

ET

Domaine contient "google.com"

ET

Date entre le 01/09/2026 et le 04/09/2026

ET

Heure entre 08:00 et 18:00
```

Le résultat doit correspondre à l'ensemble des critères sélectionnés.

---

# 10. Pagination

La pagination existante doit être conservée et adaptée aux filtres.

Lorsqu'un filtre est appliqué :

- Retourner automatiquement à la page 1.
- Recalculer le nombre total de résultats.
- Recalculer le nombre total de pages.

Exemple de réponse :

```json
{
    "items": [],
    "page": 1,
    "page_size": 50,
    "total": 245,
    "total_pages": 5
}
```

---

# 11. Tri par défaut

L'historique doit être affiché du plus récent au plus ancien.

Ordre SQL recommandé :

```sql
ORDER BY timestamp DESC
```

---

# 12. Réinitialisation des filtres

Ajouter un bouton :

```text
Réinitialiser
```

Ce bouton doit :

- Effacer l'adresse IP.
- Effacer le domaine.
- Effacer les dates.
- Effacer les heures.
- Retourner à la page 1.
- Recharger l'historique complet paginé.

---

# 13. Expérience utilisateur

Lorsqu'un filtre est en cours de chargement :

- Afficher un état de chargement.
- Ne pas bloquer l'interface inutilement.
- Éviter les requêtes multiples simultanées.

Utiliser un debounce pour les champs texte si la recherche est déclenchée automatiquement.

---

# 14. Structure Frontend recommandée

```text
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── NavigationHistory.tsx
│   ├── Machines.tsx
│   ├── ActiveFlows.tsx
│   └── Domains.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   │
│   ├── history/
│   │   ├── HistoryFilters.tsx
│   │   ├── HistoryTable.tsx
│   │   └── HistoryPagination.tsx
│   │
│   └── ui/
│
└── App.tsx
```

---

# 15. Routing React

La configuration des routes doit contenir au minimum :

```text
/dashboard

/history

/machines

/active-flows

/domains
```

Exemple conceptuel :

```text
/
├── dashboard
├── history
├── machines
├── active-flows
└── domains
```

---

# 16. Ordre de modification obligatoire

Claude Code doit procéder dans cet ordre :

## Étape 1

Analyser la structure actuelle du frontend et les routes existantes.

---

## Étape 2

Identifier si certaines fonctionnalités sont actuellement regroupées dans une même page.

---

## Étape 3

Séparer chaque fonctionnalité principale dans sa propre page sans casser les fonctionnalités existantes.

---

## Étape 4

Mettre à jour la navigation et React Router.

---

## Étape 5

Vérifier que chaque page possède son propre appel API.

---

## Étape 6

Ajouter les filtres de l'historique :

```text
IP
Domaine
Date début
Date fin
Heure début
Heure fin
```

---

## Étape 7

Modifier l'API FastAPI pour accepter les nouveaux paramètres.

---

## Étape 8

Implémenter le filtrage directement dans PostgreSQL.

---

## Étape 9

Tester la combinaison de plusieurs filtres.

Exemples obligatoires :

```text
IP uniquement

Domaine uniquement

Date uniquement

Heure uniquement

IP + Domaine

Date + Heure

IP + Domaine + Date + Heure
```

---

# 17. Résultat attendu

L'application finale doit posséder les pages suivantes :

```text
┌─────────────────────────────┐
│        Dashboard            │
├─────────────────────────────┤
│        Historique           │
├─────────────────────────────┤
│        Machines             │
├─────────────────────────────┤
│        Flows actifs         │
├─────────────────────────────┤
│        Domaines             │
└─────────────────────────────┘
```

Chaque menu doit ouvrir une page indépendante.

La page Historique doit permettre de consulter les données enregistrées dans PostgreSQL avec :

```text
✓ Pagination

✓ Filtre par adresse IP

✓ Filtre par domaine

✓ Filtre par date

✓ Filtre par plage horaire

✓ Combinaison des filtres

✓ Tri du plus récent au plus ancien
```

---

# Règle finale

Ne pas modifier l'architecture fonctionnelle existante inutilement.

L'objectif est de séparer clairement les fonctionnalités dans des pages distinctes et d'améliorer la consultation de l'historique grâce à des filtres performants exécutés côté backend et PostgreSQL.