# PHASE 1 - Implémentation Super-Admin de Base

## Objectif
Implémenter les fonctionnalités de base essentielles pour la gestion super-admin sans modifier le code existant.

## 🎯 Fonctionnalités à Implémenter

### 1. CRUD Complet d'Entreprises
- **POST** `/api/super-admin/entreprises` - Créer une nouvelle entreprise
- **PUT** `/api/super-admin/entreprises/[entrepriseId]` - Modifier une entreprise
- **DELETE** `/api/super-admin/entreprises/[entrepriseId]` - Supprimer une entreprise (avec vérifications)

### 2. Dashboard Super-Admin
- Page `/super-admin/dashboard` avec métriques globales
- Statistiques en temps réel : nombre d'entreprises, utilisateurs, sites, engins
- Liste des entreprises récemment actives

### 3. Gestion Utilisateurs Globale
- Page `/super-admin/users` - Liste de TOUS les utilisateurs de toutes entreprises
- Actions de base : voir détails, activer/désactiver, réinitialiser mot de passe
- Filtres par entreprise, par rôle, par statut

## 📋 Étapes d'Implémentation

### Étape 1: API Routes Entreprises (CRUD)
1. **Créer/Mettre à jour** `app/api/super-admin/entreprises/route.ts`
   - Ajouter la méthode POST pour créer une entreprise
   - Validation des données (nom unique, langue valide)
   - Création automatique des rôles par défaut pour la nouvelle entreprise

2. **Créer** `app/api/super-admin/entreprises/[entrepriseId]/route.ts`
   - GET : Détails d'une entreprise avec statistiques
   - PUT : Mise à jour des informations de l'entreprise
   - DELETE : Suppression avec vérifications des dépendances

### Étape 2: Dashboard Super-Admin
1. **Créer** `app/[locale]/super-admin/(main)/dashboard/page.tsx`
   - Statistiques globales avec cartes
   - Graphique d'activité par entreprise
   - Liste des dernières activités

2. **Créer** `app/api/super-admin/dashboard/stats.ts`
   - API endpoint pour les statistiques du dashboard
   - Calculs optimisés avec agrégations Prisma

3. **Créer composants** `components/super-admin/`
   - `StatsCard.tsx` - Carte de statistique
   - `RecentActivity.tsx` - Activité récente
   - `EnterpriseChart.tsx` - Graphique entreprises

### Étape 3: Gestion Utilisateurs Globale
1. **Créer** `app/api/super-admin/users/route.ts`
   - GET : Liste de tous les utilisateurs avec pagination et filtres
   - Jointures avec entreprises et rôles

2. **Créer** `app/[locale]/super-admin/(main)/users/page.tsx`
   - Tableau avec tous les utilisateurs
   - Filtres : entreprise, rôle, statut, recherche
   - Actions : voir détails, activer/désactiver

3. **Créer** `app/api/super-admin/users/[userId]/route.ts`
   - GET : Détails utilisateur
   - PUT : Activer/désactiver utilisateur
   - POST : Réinitialiser mot de passe

### Étape 4: Composants UI Réutilisables
1. **Créer** `components/super-admin/shared/`
   - `EnterpriseSelector.tsx` - Sélecteur d'entreprise
   - `UserActions.tsx` - Actions utilisateur
   - `StatusBadge.tsx` - Badge de statut

## 🔧 Validation et Tests

### Tests API à implémenter:
```bash
# Tests manuels à effectuer
curl -X POST http://localhost:3000/api/super-admin/entreprises \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Entreprise", "lang": "fr"}'

curl -X GET http://localhost:3000/api/super-admin/dashboard/stats

curl -X GET http://localhost:3000/api/super-admin/users?limit=10&page=1
```

### Vérifications Post-Implémentation:
- [ ] Les API endpoints retournent les bonnes données
- [ ] Le dashboard affiche les statistiques correctes
- [ ] La liste des utilisateurs est complète et filtrable
- [ ] La création d'entreprise génère bien les rôles par défaut
- [ ] La suppression d'entreprise vérifie les dépendances
- [ ] Les permissions super-admin fonctionnent correctement

## 📁 Structure des Fichiers à Créer

```
app/
├── api/super-admin/
│   ├── entreprises/
│   │   ├── [entrepriseId]/route.ts (NOUVEAU)
│   │   └── route.ts (MODIFIER)
│   ├── users/
│   │   ├── [userId]/route.ts (NOUVEAU)
│   │   └── route.ts (NOUVEAU)
│   └── dashboard/
│       └── stats.ts (NOUVEAU)
├── [locale]/super-admin/(main)/
│   ├── dashboard/page.tsx (NOUVEAU)
│   └── users/page.tsx (NOUVEAU)
components/super-admin/
├── StatsCard.tsx (NOUVEAU)
├── RecentActivity.tsx (NOUVEAU)
├── EnterpriseChart.tsx (NOUVEAU)
└── shared/
    ├── EnterpriseSelector.tsx (NOUVEAU)
    ├── UserActions.tsx (NOUVEAU)
    └── StatusBadge.tsx (NOUVEAU)
```

## ⚠️ Contraintes et Prérequis

### Ne PAS modifier:
- Structure existante des tables Prisma
- Routes existantes `/app/(main)` 
- Système d'authentification actuel
- Composants existants dans `/components/ui`

### À respecter:
- Utiliser les mêmes patterns que le code existant
- Maintenir la cohérence avec l'architecture RBAC
- Toujours vérifier `isSuperAdmin` dans les API super-admin
- Utiliser `entrepriseId` pour toutes les opérations multi-tenant

## 🎯 Succès de la Phase 1

À la fin de cette phase, vous devriez avoir:
- ✅ Gestion complète des entreprises (CRUD)
- ✅ Dashboard avec métriques globales
- ✅ Liste globale des utilisateurs avec actions de base
- ✅ Fondations solides pour les phases suivantes

## 🔄 Compatibilité avec Phases Suivantes

Cette phase doit:
- Créer les API endpoints de base utilisables par les phases 2 et 3
- Établir les patterns de composants super-admin
- Maintenir la rétrocompatibilité totale
- Ne modifier aucune fonctionnalité existante
