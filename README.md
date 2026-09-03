# Ntopng Advanced

Couche d'analyse au-dessus de l'instance ntopng deja installee sur pfSense.

## Etat actuel

Le projet demarre par la Phase 0 de decouverte de l'API ntopng. Aucun endpoint
metier n'est implemente avant validation de l'instance cible.

Le frontend React est maintenant disponible apres validation du backend.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Healthcheck : `http://127.0.0.1:8000/health`

## API interne disponible

Les premières routes read-only validées sur l'instance ntopng sont :

- `GET /api/v1/ntopng/interfaces`
- `GET /api/v1/ntopng/interfaces/{interface_id}`
- `GET /api/v1/ntopng/hosts?ifid={interface_id}&page=1&page_size=50`
- `GET /api/v1/ntopng/flows?ifid={interface_id}&page=1&page_size=50`

L'interface actuellement détectée est `em0` avec `ifid=0`.
Les flows historiques restent indisponibles sur l'instance testée : le endpoint
ntopng répond `403` avec une requête conforme à la documentation.

## Configuration

Depuis la racine du projet, copier `.env.example` vers `.env`, puis renseigner uniquement les parametres
ntopng reels. Le fichier `.env` ne doit jamais etre versionne.

## Tester la connexion ntopng

Depuis la racine du projet :

```powershell
Copy-Item .env.example .env
notepad .env
$env:PYTHONPATH = (Join-Path $PWD 'backend')
& 'C:/Python314/python.exe' backend/scripts/discover_ntopng.py
```

Le script teste uniquement des endpoints GET en lecture seule. Il n'affiche pas
le token. Le certificat local est accepte avec `NTOPNG_VERIFY_SSL=false`.

## Tester l'API locale

Dans un premier terminal :

```powershell
$env:PYTHONPATH = (Join-Path $PWD 'backend')
& 'C:/Python314/python.exe' -m uvicorn app.main:app --app-dir backend --reload
```

Dans un second terminal :

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/api/v1/ntopng/interfaces
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/ntopng/hosts?ifid=0&page=1&page_size=10'
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/ntopng/flows?ifid=0&page=1&page_size=10'
```

Les tests automatisés se lancent avec :

```powershell
$env:PYTHONPATH = (Join-Path $PWD 'backend')
& 'C:/Python314/python.exe' -m pytest backend/tests -q
```

## Déploiement Docker sur Debian 13

Installer Docker Engine et le plugin Compose sur le serveur Debian, puis copier
le projet sur le serveur. Depuis sa racine :

```bash
cp .env.example .env
nano .env
docker compose config
docker compose up -d --build
docker compose ps
```

Le fichier `.env` doit au minimum contenir :

```env
NTOPNG_BASE_URL=https://192.168.0.1:3000
NTOPNG_API_KEY=remplacer_par_le_token
NTOPNG_VERIFY_SSL=false
```

Tester le conteneur :

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/ntopng/interfaces
docker compose logs -f backend
```

Le backend écoute sur le port `8000`. Pour un serveur exposé, placer ensuite un
reverse proxy HTTPS devant ce port et ne pas exposer ntopng directement sur Internet.

L'interface web est servie par Nginx sur le port `80` :
`http://ADRESSE_SERVEUR/`. Les appels `/api/` sont relayés automatiquement vers
le backend Docker. La documentation FastAPI reste accessible sur
`http://ADRESSE_SERVEUR:8000/docs`.

Arrêter le service :

```bash
docker compose down
```