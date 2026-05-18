# 📚 TP3 — Ma Bibliothèque Docker

Application web complète de gestion de bibliothèque personnelle construite avec Docker Compose.
Permet de rechercher des livres via Open Library, de les ajouter à sa bibliothèque et de gérer leur statut de lecture.

---

## 🏗️ Architecture

```text
Navigateur
    ↓
nginx (port 80) — production uniquement
    ↓
client React + Vite (port 3000) — développement
    ↓
API Node.js + Express (port 5000)
    ↓
MongoDB (port 27017)
```

| Service    | Image / Tech         | Rôle                                      |
|------------|----------------------|-------------------------------------------|
| `client`   | React + Vite         | Interface utilisateur                     |
| `api`      | Node.js + Express    | API REST + appels Open Library            |
| `database` | MongoDB 7            | Stockage persistant des livres            |
| `nginx`    | nginx:alpine         | Reverse proxy + serveur fichiers statiques|

---

## 🚀 Lancement en développement

### Prérequis
- Docker Desktop installé et démarré
- WSL2 (Windows) ou Linux/macOS

### Commandes

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd tp3-docker-bibliotheque

# 2. Lancer tous les services
docker compose up --build
```

### Accès
- Application React : http://localhost:3000
- API : http://localhost:5000/api/health

### Commandes utiles

```bash
# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un service
docker compose logs -f api

# Voir les conteneurs actifs
docker compose ps

# Arrêter sans perdre les données
docker compose down

# Arrêter et supprimer les volumes
docker compose down -v

# Entrer dans un conteneur
docker compose exec api sh
```

---

## 🏭 Lancement en production

```bash
docker compose -f docker-compose.prod.yml up --build
```

### Accès
- Application complète : http://localhost

### Différences avec le développement

| | Développement | Production |
|---|---|---|
| Port d'accès | 3000 (React) + 5000 (API) | 80 (nginx uniquement) |
| Live reload | ✅ Oui | ❌ Non |
| Bind mounts | ✅ Code monté | ❌ Image compilée |
| React | Serveur Vite | Fichiers statiques compilés |
| API | nodemon | node |

---

## 🔑 Variables d'environnement

Copiez `.env.example` en `.env` dans chaque dossier :

```bash
cp .env.example api/.env
```

### `api/.env`

```env
PORT=5000
MONGO_URL=mongodb://database:27017/bibliotheque
NODE_ENV=development
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🛣️ Routes de l'API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Vérification que l'API fonctionne |
| GET | `/api/search?q=<query>` | Recherche de livres via Open Library |
| GET | `/api/books` | Liste tous les livres sauvegardés |
| POST | `/api/books` | Ajouter un livre à la bibliothèque |
| PATCH | `/api/books/:id/status` | Changer le statut (à lire → en cours → lu) |
| DELETE | `/api/books/:id` | Supprimer un livre |

### Exemples

```bash
# Santé de l'API
curl http://localhost:5000/api/health

# Rechercher un livre
curl "http://localhost:5000/api/search?q=germinal"

# Lister les livres
curl http://localhost:5000/api/books

# Ajouter un livre
curl -X POST http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Germinal","author":"Émile Zola","year":1885}'

# Changer le statut
curl -X PATCH http://localhost:5000/api/books/<id>/status

# Supprimer un livre
curl -X DELETE http://localhost:5000/api/books/<id>
```

---

## 📁 Structure du projet

```text
tp3-docker-bibliotheque/
├── client/
│   ├── src/
│   │   ├── App.jsx          — composant principal
│   │   └── main.jsx         — point d'entrée React
│   ├── Dockerfile           — image développement
│   ├── Dockerfile.prod      — image production (multi-stage)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── api/
│   ├── models/
│   │   └── Book.js          — schéma MongoDB
│   ├── routes/
│   │   └── books.js         — routes Express
│   ├── Dockerfile
│   ├── package.json
│   └── server.js            — point d'entrée Node.js
├── nginx/
│   └── nginx.conf           — configuration reverse proxy
├── docker-compose.yml       — environnement développement
├── docker-compose.prod.yml  — environnement production
├── .env.example
├── .gitignore
└── README.md
```

---

## 🌐 API externe utilisée

**Open Library** — https://openlibrary.org

- Gratuite, sans clé API
- Utilisée pour rechercher des livres et récupérer les couvertures
- Endpoint : `https://openlibrary.org/search.json?q=<query>`
- Couvertures : `https://covers.openlibrary.org/b/id/<cover_id>-M.jpg`

---

## 🐛 Problèmes rencontrés

### 1. MONGO_URL pointait vers localhost dans Docker

**Problème** : L'API retournait `connect ECONNREFUSED 127.0.0.1:27017` car le fichier `.env` local contenait `MONGO_URL=mongodb://localhost:27017/bibliotheque`.

**Solution** : Dans Docker Compose, les services communiquent par leur nom de service. Il faut utiliser `mongodb://database:27017/bibliotheque` où `database` est le nom du service MongoDB déclaré dans `docker-compose.yml`.

### 2. Variable VITE_API_URL non transmise

**Problème** : React affichait "Impossible de contacter l'API" car Vite intègre les variables d'environnement au moment du build, pas à l'exécution.

**Solution** : S'assurer que `VITE_API_URL` est déclarée dans `docker-compose.yml` sous `environment` et forcer un rebuild avec `docker compose up --build`.

### 3. books.filter is not a function

**Problème** : Quand l'API retournait une erreur JSON au lieu d'un tableau, React plantait en essayant d'appeler `.filter()` sur un objet.

**Solution** : Ajouter une vérification `Array.isArray(data)` avant d'utiliser les données retournées par l'API.

---

## 👤 Auteur

Travail pratique réalisé dans le cadre du cours Docker et déploiement d'applications.
