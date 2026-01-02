# PHASE 3 : SÉCURITÉ & RBAC

1️⃣ Implémente la logique RBAC dans `core/auth/rbac.ts` (permissions, guards, policies).

2️⃣ Crée le middleware RBAC dans `middlewares/rbac-middleware.ts` pour vérifier les permissions à chaque requête API.

3️⃣ Ajoute le middleware d’authentification (JWT/session) si ce n’est pas déjà fait.

4️⃣ Protéger toutes les routes API par la chaîne de middlewares : auth → tenant → RBAC.

5️⃣ Ajoute des tests unitaires pour vérifier l’absence d’accès cross-tenant.
