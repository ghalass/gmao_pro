# PHASE 2 - Fonctionnalités Avancées Super-Admin

## Objectif
Implémenter les fonctionnalités avancées de gestion et monitoring en s'appuyant sur les bases de la Phase 1.

## 🎯 Fonctionnalités à Implémenter

### 1. Impersonification Utilisateurs
- Permettre au super-admin de se connecter en tant que n'importe quel utilisateur
- Session d'impersonification sécurisée avec retour au super-admin
- Journalisation des actions pendant l'impersonification

### 2. Analytics Avancés
- Tableaux de bord avec graphiques détaillés
- Rapports d'utilisation par entreprise
- Export de données en CSV/Excel
- Métriques de performance et adoption

### 3. Configuration Entreprise
- Paramètres personnalisés par entreprise
- Limites (utilisateurs, stockage, fonctionnalités)
- Gestion des abonnements et plans tarifaires
- Mode dégradé pour entreprises suspendues

## 📋 Étapes d'Implémentation

### Étape 1: Impersonification Utilisateurs
1. **Créer** `app/api/super-admin/users/[userId]/impersonate/route.ts`
   - POST : Démarrer une session d'impersonification
   - Vérification des permissions super-admin
   - Création d'un token sécurisé temporaire

2. **Créer** `app/api/super-admin/impersonate/stop/route.ts`
   - POST : Arrêter l'impersonification
   - Retour à la session super-admin originale

3. **Modifier** `lib/auth.ts`
   - Ajouter gestion de l'impersonification
   - Vérification des tokens temporaires
   - Maintien de la session originale

4. **Créer composant** `components/super-admin/ImpersonationButton.tsx`
   - Bouton d'impersonification avec confirmation
   - Indicateur visuel quand en mode impersonification

### Étape 2: Analytics Avancés
1. **Créer** `app/api/super-admin/analytics/route.ts`
   - GET : Statistiques détaillées avec filtres temporels
   - Agrégations complexes par entreprise
   - Données pour graphiques et exports

2. **Créer** `app/[locale]/super-admin/(main)/analytics/page.tsx`
   - Dashboard analytique complet
   - Graphiques : utilisation, croissance, performance
   - Filtres temporels et par entreprise

3. **Créer composants** `components/super-admin/analytics/`
   - `UsageChart.tsx` - Graphique d'utilisation
   - `GrowthChart.tsx` - Graphique de croissance
   - `PerformanceMetrics.tsx` - Métriques de performance
   - `ExportButton.tsx` - Export de données

4. **Créer** `app/api/super-admin/analytics/export/route.ts`
   - GET : Export CSV/Excel des données analytiques
   - Génération de fichiers selon les filtres

### Étape 3: Configuration Entreprise
1. **Créer** `app/api/super-admin/entreprises/[entrepriseId]/settings/route.ts`
   - GET : Paramètres actuels de l'entreprise
   - PUT : Mise à jour des paramètres
   - Validation des limites et contraintes

2. **Créer** `app/[locale]/super-admin/(main)/entreprises/[entrepriseId]/settings/page.tsx`
   - Interface de configuration complète
   - Formulaires pour limites et fonctionnalités
   - Gestion des abonnements

3. **Créer** `lib/entreprise-config.ts`
   - Types pour la configuration entreprise
   - Validation des paramètres
   - Calculs des limites et quotas

4. **Créer composants** `components/super-admin/entreprise-settings/`
   - `LimitsForm.tsx` - Formulaire des limites
   - `FeaturesToggle.tsx` - Activation fonctionnalités
   - `SubscriptionCard.tsx` - Gestion abonnement

### Étape 4: Middleware de Vérification
1. **Créer** `lib/middleware/entreprise-limits.ts`
   - Vérification des limites lors des opérations
   - Bloquer les actions dépassant les quotas
   - Mode dégradé automatique

2. **Modifier** les API existantes pour intégrer les vérifications
   - Création d'utilisateurs
   - Import de données
   - Création de ressources

## 🔧 Validation et Tests

### Tests d'Impersonification:
```bash
# Test impersonification
curl -X POST http://localhost:3000/api/super-admin/users/[userId]/impersonate

# Test arrêt impersonification
curl -X POST http://localhost:3000/api/super-admin/impersonate/stop
```

### Tests Analytics:
```bash
# Test statistiques
curl -X GET "http://localhost:3000/api/super-admin/analytics?period=30d"

# Test export
curl -X GET "http://localhost:3000/api/super-admin/analytics/export?format=csv"
```

### Tests Configuration:
```bash
# Test mise à jour settings
curl -X PUT http://localhost:3000/api/super-admin/entreprises/[entrepriseId]/settings \
  -H "Content-Type: application/json" \
  -d '{"maxUsers": 50, "features": ["engins", "pannes"]}'
```

### Vérifications Post-Implémentation:
- [ ] L'impersonification fonctionne et est sécurisée
- [ ] Les analytics affichent des données correctes
- [ ] L'export génère des fichiers valides
- [ ] La configuration entreprise est bien appliquée
- [ ] Les limites sont respectées dans tout le système
- [ ] Le mode dégradé fonctionne correctement

## 📁 Structure des Fichiers à Créer

```
app/
├── api/super-admin/
│   ├── users/[userId]/impersonate/route.ts (NOUVEAU)
│   ├── impersonate/stop/route.ts (NOUVEAU)
│   ├── analytics/
│   │   ├── route.ts (NOUVEAU)
│   │   └── export/route.ts (NOUVEAU)
│   └── entreprises/[entrepriseId]/settings/route.ts (NOUVEAU)
├── [locale]/super-admin/(main)/
│   ├── analytics/page.tsx (NOUVEAU)
│   └── entreprises/[entrepriseId]/settings/page.tsx (NOUVEAU)
components/super-admin/
├── ImpersonationButton.tsx (NOUVEAU)
├── analytics/
│   ├── UsageChart.tsx (NOUVEAU)
│   ├── GrowthChart.tsx (NOUVEAU)
│   ├── PerformanceMetrics.tsx (NOUVEAU)
│   └── ExportButton.tsx (NOUVEAU)
└── entreprise-settings/
    ├── LimitsForm.tsx (NOUVEAU)
    ├── FeaturesToggle.tsx (NOUVEAU)
    └── SubscriptionCard.tsx (NOUVEAU)
lib/
├── entreprise-config.ts (NOUVEAU)
└── middleware/entreprise-limits.ts (NOUVEAU)
```

## 🔗 Dépendances avec Phase 1

### Utilisation des APIs Phase 1:
- `GET /api/super-admin/users` pour la liste d'utilisateurs à impersonifier
- `GET /api/super-admin/entreprises` pour les analytics
- Structure de composants super-admin établie

### Extensions des fonctionnalités:
- Ajout de colonnes "Actions" dans la table utilisateurs Phase 1
- Ajout de liens "Settings" dans les cartes entreprises Phase 1
- Enrichissement du dashboard avec analytics

## ⚠️ Contraintes et Prérequis

### Obligatoire:
- Phase 1 doit être complètement fonctionnelle
- Tous les tests Phase 1 doivent passer
- Base de données accessible et performante

### À respecter:
- Sécurité maximale pour l'impersonification
- Performance des analytics (cache, agrégations)
- Validation stricte des configurations
- Journalisation complète des actions super-admin

### Ne PAS modifier:
- API routes de la Phase 1 (uniquement étendre)
- Structure de base de données
- Système d'authentification principal

## 🎯 Succès de la Phase 2

À la fin de cette phase, vous devriez avoir:
- ✅ Impersonification sécurisée et fonctionnelle
- ✅ Analytics détaillés avec exports
- ✅ Configuration entreprise complète
- ✅ Système de limites et quotas opérationnel

## 🔄 Compatibilité avec Phase 3

Cette phase doit:
- Préparer les données pour les rapports avancés
- Établir les patterns de configuration pour les abonnements
- Maintenir la performance pour les futures fonctionnalités
- Créer les fondations pour le monitoring système
