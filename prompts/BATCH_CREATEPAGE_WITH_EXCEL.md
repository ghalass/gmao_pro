# PROMPT BATCH_CREATEPAGE_WITH_EXCEL.md

Exécute la création complète de pages de gestion pour une liste de ressources avec système d'importation Excel pour création et modification (identique à celui de la page sites).

## Instructions d'exécution :

### 1. Analyser le schema.prisma
Pour chaque `[RESOURCE_NAME]` fourni dans la liste :
- Lire le fichier `prisma/schema.prisma`
- Identifier le `model [MODEL_NAME]` correspondant
- Extraire tous les champs du modèle
- Identifier les contraintes uniques (`@@unique`)
- Identifier les relations avec d'autres modèles
- Déterminer les champs obligatoires vs optionnels

### 2. Pour chaque ressource dans la liste, créer ou modifier les fichiers suivants pour respecter le modèle de la page sites :

#### Page principale
- `app/[locale]/(main)/[resource_name]/page.tsx`
  - Tableau avec données paginées
  - Barre de recherche et filtres
  - Boutons "Créer", "Importer Excel", "Modifier Excel"
  - Gestion des états (loading, error, success)
  - ViewMode : "list" | "import" | "update-import"

#### Composants de création/modification
- `app/[locale]/(main)/[resource_name]/_components/new-[resource].tsx`
- `app/[locale]/(main)/[resource_name]/_components/edit-[resource].tsx`
- `app/[locale]/(main)/[resource_name]/_components/delete-[resource].tsx`
- `app/[locale]/(main)/[resource_name]/_components/[resource]-row-actions.tsx`

#### Composants d'importation Excel
- `app/[locale]/(main)/[resource_name]/_components/[Resource]Import.tsx`
- `app/[locale]/(main)/[resource_name]/_components/[Resource]UpdateImport.tsx`

#### Schémas de validation
- `lib/validation/[resource]-import.schema.ts`
- `lib/validation/[resource]-update-import.schema.ts`

#### Endpoints API
- `app/api/[resource_name]/route.ts` (GET, POST)
- `app/api/[resource_name]/[id]/route.ts` (GET, PUT, DELETE)
- `app/api/[resource_name]/import/route.ts` (POST, GET - template)
- `app/api/[resource_name]/update-import/route.ts` (POST, GET - template)

### 3. Fonctionnalités requises pour chaque ressource :

#### CRUD complet :
- ✅ **Création** : Formulaire avec validation Yup
- ✅ **Lecture** : Tableau avec pagination et recherche
- ✅ **Modification** : Formulaire d'édition et importation Excel
- ✅ **Suppression** : Dialog de confirmation avec vérification des dépendances

#### Importation Excel :
- ✅ **Création** : Importer de nouvelles ressources depuis Excel
- ✅ **Modification** : Modifier des ressources existantes depuis Excel
- ✅ **Templates** : Génération automatique des templates Excel
- ✅ **Validation** : Validation complète avec messages d'erreur détaillés
- ✅ **Mapping** : Mapping flexible des colonnes Excel

#### Architecture technique :
- ✅ **TypeScript strict** avec types Prisma générés
- ✅ **Yup validation** pour tous les formulaires
- ✅ **RBAC permissions** avec middleware de protection
- ✅ **EntrepriseId filtering** dans tous les endpoints
- ✅ **Toast notifications** pour feedback utilisateur
- ✅ **Loading states** avec spinners
- ✅ **Responsive design** avec Tailwind CSS
- ✅ **Error handling** centralisé
- ✅ **Internationalisation** support (fr/ar)

#### UI/UX cohérente :
- ✅ **shadcn/ui components** (Button, Card, Table, Dialog, etc.)
- ✅ **Lucide icons** pour l'interface
- ✅ **Sonner toasts** pour les notifications
- ✅ **Design patterns** identiques à la page sites
- ✅ **Navigation** fluide entre les vues

### 4. Logique d'identification pour modification Excel :

#### Règle principale :
**TOUJOURS utiliser des champs métier pour l'identification, jamais l'ID technique Prisma**

#### Stratégie d'identification par ordre de priorité :
1. **Contrainte unique avec entrepriseId** : `@@unique([champ_metier, entrepriseId])`
   - Utiliser `champ_metier` comme identifiant (entrepriseId est automatique via session)
   - Exemple : `@@unique([name, entrepriseId])` → identification par "name" uniquement

2. **Contrainte unique simple** : `@@unique([champ_metier])`
   - Utiliser `champ_metier` comme identifiant
   - Exemple : `@@unique([code])` → identification par "code"

3. **Plusieurs contraintes uniques** :
   - Privilégier celle contenant `entrepriseId` (mais n'utiliser que le champ métier dans Excel)
   - Sinon, utiliser la plus "métier" (nom, code, référence)

4. **Pas de contrainte unique** :
   - Identifier le meilleur champ métier : `name`, `code`, `reference`, `libelle`, etc.
   - Si aucun champ évident, utiliser une combinaison de champs
   - Exemple : `name + type` ou `code + categorie`

#### Important : entrepriseId automatique
- **entrepriseId n'est JAMAIS inclus dans les fichiers Excel**
- Il est automatiquement récupéré via la session utilisateur (access_token)
- Toutes les opérations API filtrent automatiquement par entrepriseId
- Les contraintes `@@unique([champ, entrepriseId])` sont respectées côté serveur

#### Exemples d'identification par type de ressource :
```prisma
// Cas 1 : Contrainte avec entrepriseId (idéal)
model Site {
  name String
  @@unique([name, entrepriseId]) // → identification par "name"
}

// Cas 2 : Contrainte simple
model TypeOrgane {
  code String
  libelle String
  @@unique([code]) // → identification par "code"
}

// Cas 3 : Pas de contrainte (à éviter)
model Marque {
  nom String
  pays String?
  // → identification par "nom" (champ métier évident)
}

// Cas 4 : Relations avec mapping
model Engin {
  immatriculation String
  typeEnginId String
  marqueId String
  @@unique([immatriculation, entrepriseId])
  
  // Dans Excel : colonnes "Type d'engin" et "Marque" (pas les IDs)
  // Mapping côté serveur : "Camion" → typeEnginId, "Volvo" → marqueId
}
```

### 5. Logique d'importation Excel (adaptée selon contraintes) :

#### Pour la création :
- Colonnes obligatoires : champs requis du modèle (sauf id, createdAt, updatedAt)
- Colonnes optionnelles : champs optionnels du modèle
- Colonnes de relations : utiliser le champ unique de l'entité liée (jamais l'ID technique)
  - Exemple : pour `typeOrganeId`, utiliser `typeOrganeCode` ou `typeOrganeName` selon la contrainte unique
  - Le mapping se fait côté serveur : code/name → ID
- Validation des doublons via contraintes uniques

#### Pour la modification :
- **Si contrainte unique sur [champ, entrepriseId]** : Identification par ce champ
- **Si contrainte unique sur [champ]** : Identification par ce champ
- **Si plusieurs contraintes uniques** : Utiliser la première contrainte la plus pertinente (privilégier celle avec entrepriseId)
- **Si pas de contrainte unique** : Créer une contrainte unique sur un champ métier pertinent ou utiliser une combinaison de champs pour l'identification
- Mise à jour sélective des champs fournis
- Template pré-rempli avec données existantes

### 6. Instructions spécifiques d'implémentation :

#### Pour chaque ressource :
1. **Analyser le modèle** dans schema.prisma
2. **Déterminer l'identifiant unique** pour la modification (TOUJOURS utiliser un champ métier, jamais l'ID technique)
3. **Si pas de contrainte unique** : Identifier le meilleur champ métier pour l'identification (nom, code, référence, etc.)
4. **Générer les types TypeScript** appropriés
5. **Créer les schémas Yup** avec validation personnalisée
6. **Implémenter les endpoints API** avec permissions RBAC
7. **Construire les composants UI, avec Shadcn UI** réutilisables
8. **Intégrer l'importation Excel** avec gestion d'erreurs

#### Patterns à respecter :
- Utiliser les mêmes patterns que la page sites
- Respecter la structure des dossiers `_components`
- Maintenir la cohérence avec le codebase existant
- Ajouter les permissions RBAC appropriées
- Inclure la journalisation des opérations d'importation
- Gérer les dépendances avant suppression

### 7. Ressources à référencer pour chaque création :
**Pour chaque ressource, adapter les références suivantes :**
- Page principale : `app/[locale]/(main)/sites/page.tsx` → `app/[locale]/(main)/[resource_name]/page.tsx`
- Composant Import : `app/[locale]/(main)/sites/_components/SiteImport.tsx` → `app/[locale]/(main)/[resource_name]/_components/[Resource]Import.tsx`
- Composant UpdateImport : `app/[locale]/(main)/sites/_components/SiteUpdateImport.tsx` → `app/[locale]/(main)/[resource_name]/_components/[Resource]UpdateImport.tsx`
- Schéma validation : `lib/validation/site-import.schema.ts` → `lib/validation/[resource]-import.schema.ts`
- Schéma update validation : `lib/validation/site-update-import.schema.ts` → `lib/validation/[resource]-update-import.schema.ts`
- API import : `app/api/sites/import/route.ts` → `app/api/[resource_name]/import/route.ts`
- API update import : `app/api/sites/update-import/route.ts` → `app/api/[resource_name]/update-import/route.ts`

**Note :** Utiliser la page sites comme modèle de référence pour l'architecture et les patterns, mais adapter tous les noms, types et logiques selon la ressource spécifique.

## Format d'exécution :

### Input :
```bash
LISTE_RESSOURCES = [
  "typeparcs",
]
```

### Output attendu :
Pour chaque ressource dans la liste :
- Confirmation de l'analyse du modèle Prisma
- Création de tous les fichiers requis
- Validation de la cohérence avec l'architecture existante
- Résumé des fonctionnalités implémentées

### Ordre de traitement :
1. Lire et analyser `prisma/schema.prisma`
2. Pour chaque ressource dans la liste :
   a. Extraire les informations du modèle
   b. Créer les fichiers de page et composants
   c. Créer les schémas de validation
   d. Créer les endpoints API
   e. Valider la cohérence globale
3. Fournir un résumé complet de toutes les créations

---

**Note** : Le prompt doit s'exécuter en batch pour toutes les ressources fournies, en adaptant automatiquement chaque implémentation selon la structure spécifique du modèle Prisma correspondant.
