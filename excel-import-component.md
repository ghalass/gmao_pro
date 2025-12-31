# Système d'Importation Excel - Composant Réutilisable

## Vue d'ensemble

Le système d'importation Excel a été refactorisé en un composant générique `ExcelImport` qui peut être facilement réutilisé pour différents modèles de données dans votre application GMAO.

## Architecture

### 📁 Structure des composants

```
components/
├── ExcelImport.tsx          # Composant générique réutilisable
├── SiteImport.tsx            # Implémentation spécifique pour les sites
├── EnginImport.tsx           # Implémentation spécifique pour les engins
└── ui/
    └── progress.tsx          # Composant UI partagé
```

## 🎯 Composant Générique: `ExcelImport`

### Props

```typescript
interface ExcelImportProps {
  resourceType: string;           // Type de ressource (ex: 'site', 'engin')
  apiEndpoint: string;           // Endpoint API (ex: '/api/sites/import')
  resourceName: string;           // Nom affiché (ex: 'sites', 'engins')
  resourceDescription: string;   // Description du processus
  templateColumns: {            // Configuration des colonnes
    name: string;
    required: boolean;
    description: string;
  }[];
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}
```

### Fonctionnalités incluses

- ✅ Upload drag & drop
- ✅ Validation des types de fichiers
- ✅ Barre de progression
- ✅ Template Excel téléchargeable
- ✅ Affichage des résultats et erreurs
- ✅ Interface responsive et moderne

## 🔧 Utilisation

### 1. Importation pour les Sites

```tsx
import { SiteImport } from "@/components/SiteImport";

export default function MaPage() {
  return (
    <SiteImport 
      onImportComplete={(result) => {
        console.log("Sites importés:", result);
      }}
    />
  );
}
```

### 2. Importation pour les Engins

```tsx
import { EnginImport } from "@/components/EnginImport";

export default function EnginsPage() {
  return (
    <EnginImport 
      onImportComplete={(result) => {
        console.log("Engins importés:", result);
      }}
    />
  );
}
```

### 3. Composant personnalisé

```tsx
import { ExcelImport } from "@/components/ExcelImport";

const customColumns = [
  {
    name: "Nom du parc",
    required: true,
    description: "Nom unique du parc (obligatoire)"
  },
  {
    name: "Type de parc",
    required: true,
    description: "Type du parc (obligatoire)"
  }
];

export function ParcImport({ onImportComplete }: { onImportComplete?: Function }) {
  return (
    <ExcelImport
      resourceType="parc"
      apiEndpoint="/api/parcs/import"
      resourceName="parcs"
      resourceDescription="Importez des parcs en masse"
      templateColumns={customColumns}
      onImportComplete={onImportComplete}
    />
  );
}
```

## 📋 Intégration dans les pages existantes

### Exemple: Page des Sites avec importation

```tsx
// app/(main)/sites/page.tsx
"use client";

import { useState } from "react";
import { SiteImport } from "@/components/SiteImport";
import { Button } from "@/components/ui/button";

export default function SitesPage() {
  const [showImport, setShowImport] = useState(false);

  if (showImport) {
    return (
      <div className="container mx-auto py-8">
        <Button onClick={() => setShowImport(false)} className="mb-4">
          ← Retour
        </Button>
        <SiteImport 
          onImportComplete={(result) => {
            setShowImport(false);
            // Rafraîchir la liste des sites
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sites</h1>
        <Button onClick={() => setShowImport(true)}>
          Importer Excel
        </Button>
      </div>
      
      {/* Liste des sites existants */}
      {/* ... */}
    </div>
  );
}
```

## 🎨 Personnalisation

### Colonnes du template

Le composant génère automatiquement un template Excel basé sur la configuration `templateColumns`:

```typescript
const columns = [
  {
    name: "Nom du site*",
    required: true,
    description: "Nom unique du site"
  },
  {
    name: "Actif",
    required: false,
    description: "Statut (true/false)"
  }
];
```

### Styles et apparences

Le composant utilise Tailwind CSS et shadcn/ui, il peut être personnalisé via:

- `className` prop pour le conteneur
- Variables CSS pour les couleurs
- Surcharge des composants UI internes

## 🔄 Workflow d'importation

1. **Téléchargement du template** → L'utilisateur obtient le format Excel requis
2. **Remplissage du fichier** → L'utilisateur saisit ses données
3. **Upload du fichier** → Drag & drop ou sélection de fichier
4. **Validation** → Vérification du format et des données
5. **Traitement** → Importation avec création/mise à jour
6. **Résultats** → Affichage du résumé et des erreurs

## 📊 Résultats d'importation

Le système retourne un objet structuré:

```typescript
interface ImportResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    errors: number;
    warnings: number;
  };
  errors?: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
    severity: 'error' | 'warning';
  }>;
}
```

## 🚀 Avantages de cette architecture

### ✅ Réutilisabilité
- Un seul composant pour tous les modèles
- Configuration minimale pour chaque type
- Maintenance centralisée

### ✅ Cohérence
- Interface uniforme dans toute l'application
- Comportements identiques
- Expérience utilisateur consistante

### ✅ Extensibilité
- Facile d'ajouter de nouveaux modèles
- Personnalisation possible par modèle
- Évolutions centralisées

### ✅ Maintenance
- Logique métier partagée
- Mises à jour uniques
- Tests centralisés

## 📝 Prochaines étapes

1. **Créer les API endpoints** pour les autres modèles (engins, parcs, etc.)
2. **Adapter les schémas de validation** pour chaque modèle
3. **Intégrer dans les pages existantes** avec le pattern show/hide
4. **Ajouter la gestion des permissions** spécifiques à chaque modèle
5. **Créer des tests unitaires** pour chaque implémentation

## 🎯 Conclusion

Le système d'importation Excel est maintenant un composant réutilisable qui peut être facilement intégré dans n'importe quelle page de votre application GMAO. Il offre une expérience utilisateur moderne et cohérente tout en réduisant la duplication de code.
