# FactoryFlow — API

API Express/Mongoose pour les matieres, stocks, produits et ordres de production multi-produits. La configuration complete React + API + MongoDB est dans le [README principal](../README.md) et le fichier `compose.yaml` a la racine.

## Developpement

```powershell
npm ci
Copy-Item .env.example .env
# Renseigner SECRET_KEY et MONGO_URI vers un replica set.
npm run dev
```

L'installation du premier Admin et le demarrage des ordres utilisent des transactions : MongoDB doit fonctionner en replica set ou sur Atlas. Le fichier Compose principal fournit un replica set local.

La configuration Docker historique de ce dossier reste independante. Elle peut utiliser MongoDB Windows via `DOCKER_MONGO_URI` ; cette base doit alors aussi supporter les transactions.

## API

- `GET /api/installation/status` indique si un Admin existe ; `POST /api/installation` initialise une seule fois l'application.
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` gerent les sessions JWT.
- Les routes matieres, produits, stocks et operateurs sont reservees aux Admin.
- `POST /api/auth/register` cree un Operateur et exige une session Admin.
- `/api/production-orders` gere les ordres multi-produits. Les Operateurs ne peuvent lire et executer que leurs propres ordres.
- Les ordres copies avant l'evolution multi-produits et les requetes de planification a un seul produit restent pris en charge.
- Une transaction additionne les besoins par matiere et enregistre stock, mouvements de sortie et changement de statut. Un demarrage refuse ne laisse aucune consommation.
- La modification d'un ordre et son annulation sont reservees a l'Admin tant que l'ordre est planifie.
- `Stock.movements` conserve les entrees, sorties et corrections. `alertThreshold` peut etre nul.

Swagger : `/api-docs`. Specification : `/openapi.json` ou `docs/openapi.yaml`.

## Tests

```powershell
npm test
npm run test:services
```

Les tests `node:test` utilisent des repositories simules et ne demandent aucune base. Le script `scripts/smoke.mjs` a la racine verifie en plus les scenarios HTTP sur une nouvelle instance reelle, sans effacer de donnees existantes.

