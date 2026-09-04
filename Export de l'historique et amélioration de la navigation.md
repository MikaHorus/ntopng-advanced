# Export de l'historique et amélioration de la navigation

## Objectif

Ajouter deux améliorations importantes à l'application :

1. Permettre l'export de l'historique de navigation au format Excel et CSV.
2. Rendre la barre de navigation fixe afin qu'elle reste visible même lorsque l'utilisateur fait défiler la page.

---

# 1. Export de l'historique de navigation

## Fonctionnalité attendue

Ajouter un bouton d'export sur la page :

```text
Historique
```

L'utilisateur doit pouvoir exporter les données actuellement affichées ou correspondant aux filtres qu'il a définis.

Formats obligatoires :

- CSV
- Excel (.xlsx)

---

# 2. Bouton Exporter

Ajouter un bouton clairement visible sur la page Historique.

Exemple :

```text
[ Exporter ▾ ]
```

Le bouton doit proposer deux options :

```text
Exporter en Excel (.xlsx)

Exporter en CSV (.csv)
```

Exemple d'interface :

```text
┌──────────────────────────────────────────────────────────────┐
│ Historique de navigation                                     │
│                                                              │
│ [Filtres...]                           [ Exporter ▾ ]        │
│                                                              │
│                      Tableau historique                      │
└──────────────────────────────────────────────────────────────┘
```

---

# 3. Export selon les filtres actifs

## Règle obligatoire

L'export doit impérativement prendre en compte tous les filtres actuellement appliqués par l'utilisateur.

Exemple :

L'utilisateur applique les filtres suivants :

```text
Adresse IP :
192.168.1.25

Domaine :
google.com

Date début :
01/09/2026

Date fin :
04/09/2026

Heure début :
08:00

Heure fin :
18:00
```

Lorsqu'il clique sur :

```text
Exporter Excel
```

Le fichier exporté doit contenir uniquement les données correspondant à ces filtres.

---

# 4. Synchronisation entre filtres et export

Les paramètres utilisés pour l'export doivent être exactement les mêmes que ceux utilisés pour afficher le tableau.

Architecture recommandée :

```text
Filtres utilisateur
       |
       +-------------------+
       |                   |
       v                   v
API Historique        API Export
       |                   |
       v                   v
PostgreSQL           PostgreSQL
       |                   |
       +-------------------+
              |
              v
       Même logique de filtrage
```

Il ne doit pas exister deux logiques différentes de filtrage.

Créer une logique commune côté backend pour construire les filtres PostgreSQL.

---

# 5. API Export

Ajouter les endpoints suivants.

## Export CSV

```http
GET /api/v1/navigation-history/export/csv
```

## Export Excel

```http
GET /api/v1/navigation-history/export/xlsx
```

Les endpoints doivent accepter les mêmes paramètres que l'endpoint de consultation de l'historique.

Paramètres :

```text
local_ip
domain

date_from
date_to

time_from
time_to
```

Exemple :

```http
GET /api/v1/navigation-history/export/xlsx?local_ip=192.168.1.25&domain=google.com&date_from=2026-09-01&date_to=2026-09-04&time_from=08:00&time_to=18:00
```

---

# 6. Réutilisation de la logique de filtrage

## Important

Ne pas dupliquer la logique de filtrage entre :

```text
GET /navigation-history
```

et :

```text
GET /navigation-history/export/*
```

Créer une fonction ou un service partagé.

Exemple conceptuel :

```python
def build_navigation_history_query(
    filters: NavigationHistoryFilters,
):
    ...
```

Cette fonction doit être utilisée pour :

- L'affichage paginé.
- L'export CSV.
- L'export Excel.

La seule différence est que :

```text
Consultation :
Pagination activée.

Export :
Pagination désactivée ou traitement par lots.
```

---

# 7. Colonnes exportées

Le fichier exporté doit contenir au minimum :

| Date | Heure | Adresse IP locale | Nom d'hôte | Domaine |
|---|---|---|---|---|

Colonnes recommandées :

```text
Date
Heure
Adresse IP locale
Nom d'hôte
Domaine
Adresse IP distante
Protocole
Application
```

Les colonnes optionnelles doivent être exportées uniquement si elles existent dans les données.

---

# 8. Format Excel

Utiliser :

```text
OpenPyXL
```

Le fichier Excel doit être lisible et correctement structuré.

Recommandations :

- Première ligne en en-tête.
- Colonnes lisibles.
- Date correctement formatée.
- Heure correctement formatée.
- Nom de fichier explicite.

Exemple :

```text
historique_navigation_2026-09-04.xlsx
```

Si des filtres sont appliqués, le nom peut éventuellement inclure la période :

```text
historique_navigation_2026-09-01_au_2026-09-04.xlsx
```

---

# 9. Format CSV

Le fichier CSV doit :

- Utiliser UTF-8.
- Contenir les mêmes colonnes que l'export Excel.
- Être compatible avec Microsoft Excel.
- Utiliser un séparateur cohérent.

Nom de fichier :

```text
historique_navigation_2026-09-04.csv
```

---

# 10. Gestion des gros volumes

L'historique PostgreSQL peut devenir volumineux.

L'export ne doit pas provoquer une saturation de la mémoire.

## Règles

Ne jamais :

```text
SELECT toutes les données
↓
Charger toutes les lignes dans une liste Python
↓
Générer le fichier
```

Pour les gros volumes, utiliser une récupération par lots ou une approche adaptée au streaming lorsque cela est possible.

---

# 11. Limitation de l'export

Prévoir une protection contre les exports trop volumineux.

Par exemple :

```text
Maximum recommandé :
100 000 lignes
```

Si le volume est trop important :

- Afficher une erreur explicite.
- Ou prévoir ultérieurement une génération asynchrone.

Ne pas laisser une requête d'export saturer le serveur.

---

# 12. Frontend — Export

Créer ou ajouter un composant dédié.

Exemple :

```text
components/history/HistoryExport.tsx
```

Le composant doit :

- Récupérer les filtres actifs.
- Construire la requête d'export.
- Permettre le choix CSV ou Excel.
- Afficher un état de chargement pendant la génération.
- Gérer les erreurs.

---

# 13. État pendant l'export

Lorsqu'un export est en cours :

```text
Export en cours...
```

Le bouton peut être temporairement désactivé pour éviter plusieurs exports simultanés.

Exemple :

```text
[ ⏳ Export en cours... ]
```

En cas d'erreur :

```text
Impossible de générer le fichier d'export.
Veuillez réessayer.
```

---

# 14. Réinitialisation des filtres

Le bouton :

```text
Réinitialiser
```

doit également affecter l'export.

Après réinitialisation :

```text
Filtres = aucun filtre actif
```

Donc l'export suivant doit correspondre à toutes les données disponibles, sous réserve des limites de sécurité et de volume.

---

# 15. Barre de navigation fixe

## Objectif

La barre de navigation principale doit rester visible lorsque l'utilisateur fait défiler une page.

La navigation ne doit pas disparaître lors du scroll.

---

# 16. Comportement attendu

Actuellement, lorsqu'une page contient beaucoup de contenu :

```text
Utilisateur
    |
    | Scroll vers le bas
    v

La barre de navigation disparaît
```

Comportement souhaité :

```text
┌──────────────────────────────┐
│ Navigation                   │ ← reste fixe
│                              │
│ Dashboard                    │
│ Historique                   │
│ Machines                     │
│ Flows actifs                 │
│ Domaines                     │
├──────────────────────────────┤
│                              │
│ Contenu scrollable           │
│                              │
│                              │
│                              │
└──────────────────────────────┘
```

---

# 17. Implémentation de la navigation fixe

La barre latérale de navigation doit utiliser une position fixe ou sticky selon l'architecture actuelle.

Comportement recommandé :

```text
Desktop :
Sidebar fixe à gauche.

Mobile :
Navigation adaptée et responsive.
```

La navigation doit rester accessible quelle que soit la position de scroll.

---

# 18. Recommandation CSS

Pour une sidebar verticale :

```css
.sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
}
```

Le contenu principal doit prendre en compte la largeur de la sidebar.

Exemple conceptuel :

```css
.main-content {
    margin-left: var(--sidebar-width);
}
```

## Important

Ne pas appliquer `position: fixed` sans adapter le contenu principal.

Éviter :

- Le contenu caché derrière la sidebar.
- Les problèmes de scroll.
- Une double scrollbar.
- Les problèmes sur mobile.

---

# 19. Alternative Sticky

Si l'architecture actuelle rend une sidebar fixe difficile à maintenir, utiliser :

```css
position: sticky;
top: 0;
height: 100vh;
```

Cependant, le résultat final doit respecter le comportement suivant :

```text
La navigation reste visible pendant le scroll.
```

---

# 20. Responsive Design

La navigation fixe doit fonctionner correctement sur :

```text
Desktop
Tablette
Mobile
```

Sur mobile, éviter qu'une sidebar fixe occupe tout l'écran.

Une solution responsive peut être :

```text
Desktop :
Sidebar fixe.

Mobile :
Menu hamburger ou navigation compacte.
```

---

# 21. Pages concernées

La barre de navigation doit rester présente sur toutes les pages principales :

```text
Dashboard

Historique

Machines

Flows actifs

Domaines
```

---

# 22. Architecture Layout recommandée

Créer ou adapter un layout global.

Exemple :

```text
AppLayout
│
├── Sidebar fixe
│
└── Main Content
      │
      ├── Dashboard
      ├── Historique
      ├── Machines
      ├── Flows actifs
      └── Domaines
```

Le layout ne doit pas être recréé dans chaque page.

Utiliser un composant global.

Exemple :

```text
components/layout/AppLayout.tsx
components/layout/Sidebar.tsx
```

---

# 23. Ordre de développement

Claude Code doit procéder dans cet ordre.

## Étape 1 — Analyser l'existant

Identifier :

- Le composant de navigation actuel.
- Le système de layout.
- La structure des pages.
- Le système de filtres de l'historique.

---

## Étape 2 — Navigation fixe

Modifier le layout afin que la barre de navigation reste visible pendant le scroll.

Tester :

- Dashboard.
- Historique avec beaucoup de lignes.
- Machines.
- Flows actifs.
- Domaines.
- Mobile.

---

## Étape 3 — Backend Export

Créer la logique commune de filtrage.

Créer les endpoints :

```text
/api/v1/navigation-history/export/csv

/api/v1/navigation-history/export/xlsx
```

---

## Étape 4 — Service Export

Créer un service dédié :

```text
NavigationHistoryExportService
```

Responsabilités :

- Récupération des données filtrées.
- Génération CSV.
- Génération Excel.
- Gestion des erreurs.
- Gestion des volumes importants.

---

## Étape 5 — Frontend Export

Ajouter le bouton Exporter dans la page Historique.

Options :

```text
Exporter en Excel

Exporter en CSV
```

Les filtres actifs doivent être automatiquement transmis à l'API.

---

## Étape 6 — Tests

Tester obligatoirement :

### Export sans filtre

```text
Historique complet
```

### Export avec IP

```text
192.168.1.25
```

### Export avec domaine

```text
google.com
```

### Export avec date

```text
01/09/2026 → 04/09/2026
```

### Export avec heure

```text
08:00 → 18:00
```

### Export avec plusieurs filtres

```text
IP
+
Domaine
+
Date
+
Heure
```

Le contenu exporté doit correspondre exactement aux résultats attendus.

---

# 24. Règles strictes

Claude Code ne doit pas :

- Exporter des données qui ne correspondent pas aux filtres actifs.
- Dupliquer la logique de filtrage.
- Charger inutilement toutes les données PostgreSQL en mémoire.
- Permettre plusieurs exports simultanés accidentels.
- Casser la pagination existante.
- Casser les autres pages lors de la modification du layout.
- Rendre la navigation fixe uniquement sur une page.
- Créer une navigation différente pour chaque page.

---

# Résultat attendu

## Historique

La page Historique doit contenir :

```text
Filtres
├── Adresse IP
├── Domaine
├── Date début
├── Date fin
├── Heure début
└── Heure fin

Actions
├── Rechercher
├── Réinitialiser
└── Exporter
    ├── Excel (.xlsx)
    └── CSV (.csv)

Tableau paginé
```

## Navigation

La navigation doit rester visible et fixe pendant le défilement de toutes les pages de l'application.

---

# Règle finale

L'export doit toujours refléter exactement les critères de recherche actifs au moment où l'utilisateur clique sur le bouton Exporter.

La barre de navigation doit rester accessible en permanence pendant la navigation dans l'application, sans dégrader l'expérience utilisateur sur desktop ou mobile.