# PHASE 2 : MULTI-TENANCY & CONTEXT

1️⃣ Implémente la fonction d’extraction du tenant dans `core/tenant/tenant-context.ts` (extraction de `entrepriseId` depuis le JWT/session/header).

2️⃣ Crée le wrapper Prisma multi-tenant dans `core/db/prisma-tenant.ts` qui injecte automatiquement `entrepriseId` dans toutes les requêtes.

3️⃣ Ajoute le middleware Next.js dans `middlewares/tenant-middleware.ts` pour hydrater le context tenant à chaque requête API.

4️⃣ Refactore les repositories/services pour utiliser le wrapper Prisma et ne jamais manipuler `entrepriseId` dans les handlers API.
