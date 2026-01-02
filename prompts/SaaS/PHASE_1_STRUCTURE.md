# PHASE 1 : STRUCTURE & SÉPARATION DES RESPONSABILITÉS

1️⃣ Crée la structure de dossiers suivante à la racine du projet :
- `/core` (logique transversale : db, auth, tenant, utils)
- `/domains` (logique métier par domaine)
- `/middlewares` (middlewares API)

2️⃣ Déplace ou crée les fichiers suivants :
- `core/db/prisma.ts` (instance Prisma)
- `core/tenant/tenant-context.ts` (extraction du tenant)
- `core/db/prisma-tenant.ts` (wrapper Prisma multi-tenant)
- `core/auth/rbac.ts` (logique RBAC)
- `middlewares/tenant-middleware.ts` (middleware extraction tenant)
- `middlewares/rbac-middleware.ts` (middleware RBAC)

3️⃣ Pour chaque domaine métier (ex: engins, users), crée un dossier dans `/domains` avec :
- `*.service.ts` (logique métier)
- `*.repository.ts` (accès DB)
- `*.validation.ts` (validation)
- `*.types.ts` (types)
