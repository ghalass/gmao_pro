Tu es un architecte logiciel senior spécialisé en SaaS multi-tenant, sécurité applicative, Prisma ORM et Next.js (App Router).

Je vais te fournir l’architecture actuelle de mon projet (arborescence + choix techniques).
Le projet est une application SaaS multi-tenant basée sur Prisma + PostgreSQL avec un tenant identifié par `entrepriseId` présent dans presque tous les modèles.

🎯 OBJECTIF
Analyser mon architecture actuelle et me proposer une version AMÉLIORÉE pour obtenir :
- une isolation multi-tenant robuste
- une sécurité maximale (RBAC, data leaks, auth, permissions)
- une architecture scalable (modules, performances, croissance SaaS)
- une base maintenable long terme (clean architecture / DDD light)

---

📌 CONTEXTE MÉTIER
- Application GMAO complexe (engins, parcs, anomalies, HRM/HIM, organes, lubrifiants, imports)
- Multi-tenant strict basé sur `Entreprise`
- RBAC via User / Role / Permission (resource + action)
- Import massif de données (ImportLog)
- Reporting & dashboards

---

📋 TA MISSION (OBLIGATOIRE)

1️⃣ ANALYSE
- Identifier les points faibles de l’architecture actuelle
- Détecter les risques de fuite de données entre tenants
- Identifier les problèmes de scalabilité, de sécurité ou de coupling

2️⃣ AMÉLIORATIONS STRUCTURELLES
Proposer :
- une structure de dossiers améliorée
- une meilleure séparation des responsabilités
- un découpage modulaire clair (par domaine métier)

3️⃣ MULTI-TENANCY
- Me proposer la meilleure stratégie multi-tenant adaptée à Prisma
- Middleware tenant
- Pattern recommandé (tenant context, prisma wrapper, etc.)
- Me dire précisément où injecter `entrepriseId`

4️⃣ SÉCURITÉ
- Stratégie RBAC robuste basée sur mon schéma
- Guards / policies
- Sécurisation des API routes
- Protection contre les accès cross-tenant

5️⃣ SCALABILITÉ & PERFORMANCE
- Index DB recommandés
- Bonnes pratiques Prisma
- Patterns pour imports massifs et reporting
- Préparation à une montée en charge (100+ entreprises)

6️⃣ CONCRÈTEMENT
- Fournir des exemples de code si nécessaire
- Fournir une arborescence cible
- Donner une checklist claire des actions à faire

---

⚠️ CONTRAINTES IMPORTANTES
- Ne pas changer le modèle multi-tenant basé sur `entrepriseId`
- Les propositions doivent être compatibles avec Prisma + PostgreSQL
- Rester pragmatique (pas de microservices inutiles)
- Priorité à la sécurité et à la maintenabilité

---

📦 ENTRÉE
Je vais maintenant te fournir l’architecture actuelle de mon projet.
Analyse-la et applique STRICTEMENT les consignes ci-dessus.
