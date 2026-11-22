# FactoryFlow — React

Interface React/Vite connectee a l'API FactoryFlow. Demarrage, architecture, tests et Docker sont detailles dans le [README principal](../README.md).

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Laisser `VITE_API_URL=` pour utiliser le proxy Vite vers le backend sur le port 3001.

```powershell
npm run lint
npm test
npm run build
```

En production, Nginx sert le build, conserve les URLs React lors d'une actualisation et transmet `/api` au service backend.

