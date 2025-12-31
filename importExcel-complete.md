# Système d'Importation Excel pour les Sites

## Vue d'ensemble

Ce système permet d'importer des sites en masse à partir de fichiers Excel (.xlsx, .xls, .csv) avec validation des données, gestion des erreurs et traçabilité des modifications.

## Fonctionnalités

### ✅ Fonctionnalités implémentées

1. **Upload de fichiers Excel**
   - Support des formats .xlsx, .xls, .csv
   - Drag & drop interface
   - Validation du type de fichier

2. **Validation des données**
   - Schéma de validation avec Yup
   - Mapping flexible des colonnes
   - Gestion des erreurs détaillées

3. **Traitement CRUD**
   - Création de nouveaux sites
   - Mise à jour des sites existants
   - Respect des contraintes d'unicité

4. **Gestion des erreurs**
   - Erreurs de validation par ligne
   - Messages d'erreur explicites
   - Interface détaillée des erreurs

5. **Traçabilité**
   - Journalisation des opérations d'importation
   - Historique des modifications
   - Statistiques détaillées

6. **Interface utilisateur**
   - Composant React moderne avec shadcn/ui
   - Barre de progression
   - Résumé visuel des résultats

## Structure des fichiers

```
├── app/api/sites/import/route.ts          # API endpoint pour l'importation
├── lib/validation/site-import.schema.ts   # Schéma de validation
├── lib/import-logger.ts                  # Système de traçabilité
├── components/SiteImport.tsx              # Composant frontend
├── components/ui/progress.tsx             # Composant Progress
├── app/(main)/sites/import/page.tsx       # Page d'exemple
└── prisma/schema.prisma                   # Modèle ImportLog ajouté
```

## Format du fichier Excel

### Colonnes requises
- **Nom du site*** (obligatoire)
- **Actif** (optionnel)
- **Entreprise** (optionnel)

### Exemple de données
```
Nom du site*    | Actif | Entreprise
Site Principal  | true  | Ma Entreprise
Site Secondaire| false | 
Site Annexe     | 1     | Ma Entreprise
```

## Validation des données

### Nom du site
- Obligatoire
- Minimum 2 caractères
- Maximum 100 caractères
- Caractères alphanumériques + espaces + tirets
- Unique par entreprise

### Actif
- Optionnel
- Accepte: true/false, oui/non, 1/0
- Défaut: true

### Entreprise
- Optionnel
- Maximum 100 caractères
- Utilisé pour les multi-entreprises

## API Endpoints

### POST /api/sites/import
Importe un fichier Excel de sites.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (fichier Excel)

**Response:**
```json
{
  "success": true,
  "message": "Importation réussie: 5 créés, 2 mis à jour",
  "summary": {
    "total": 7,
    "created": 5,
    "updated": 2,
    "errors": 0,
    "warnings": 0
  },
  "errors": []
}
```

### GET /api/sites/import
Télécharge le template Excel.

**Request:**
- Method: GET

**Response:**
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename=sites_template.xlsx

## Gestion des erreurs

### Types d'erreurs
1. **Erreurs de validation** (format, données invalides)
2. **Erreurs de traitement** (doublons, contraintes)
3. **Erreurs système** (base de données, fichiers)

### Format des erreurs
```json
{
  "row": 3,
  "field": "name",
  "value": "",
  "message": "Le nom du site est obligatoire",
  "severity": "error"
}
```

## Traçabilité

### ImportLog
Chaque opération d'importation est journalisée avec:
- Informations sur le fichier
- Statistiques de traitement
- Statut (SUCCESS/PARTIAL/FAILED)
- Détails des erreurs
- Métadonnées utilisateur et entreprise

### Consultation de l'historique
Les fonctions `getImportHistory()` et `getImportDetails()` permettent de consulter l'historique des importations.

## Sécurité

### Permissions
- Vérification des permissions de création (`protectCreateRoute`)
- Isolation par entreprise
- Validation des entrées utilisateur

### Contraintes
- Respect des clés étrangères
- Unicité des noms de sites
- Validation des types de données

## Utilisation

### Installation des dépendances
```bash
pnpm add xlsx @types/xlsx @types/multer multer
```

### Migration de la base de données
```bash
pnpm prisma migrate dev --name add_import_logs
```

### Intégration dans une page
```tsx
import { SiteImport } from "@/components/SiteImport";

export default function MaPage() {
  return (
    <SiteImport 
      onImportComplete={(result) => {
        console.log("Importation terminée:", result);
      }}
    />
  );
}
```

## Tests recommandés

1. **Test de validation**: Fichier avec données invalides
2. **Test de création**: Fichier avec nouveaux sites
3. **Test de mise à jour**: Fichier avec sites existants
4. **Test d'erreurs**: Fichier corrompu ou format incorrect
5. **Test de traçabilité**: Vérification des logs

## Améliorations futures

1. **Importation async**: Pour gros fichiers
2. **Preview avant import**: Validation visuelle
3. **Export des erreurs**: Fichier Excel des erreurs
4. **Importation d'autres modèles**: Engins, Parcs, etc.
5. **Notifications**: Email/webhook pour les importations
