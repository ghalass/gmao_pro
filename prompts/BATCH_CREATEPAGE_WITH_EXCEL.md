# PROMPT BATCH_CREATEPAGE_WITH_EXCEL.md

## Objectif
Création complète de pages de gestion avec système d'importation Excel pour une liste de ressources, en suivant l'architecture de la page sites.

## Input
```bash
LISTE_RESSOURCES = [
  "entreprises",
]
```

## 🏗️ Architecture de référence
Modèle à suivre : `app/[locale]/(main)/sites/` avec tous ses composants et endpoints API.

---

## 1. ANALYSE PRÉALABLE

### 1.1. Lecture du schéma Prisma
Pour chaque `[RESOURCE_NAME]` dans `LISTE_RESSOURCES` :

- **Lire** `prisma/schema.prisma`
- **Identifier** le `model [MODEL_NAME]` correspondant
- **Extraire** tous les champs du modèle
- **Identifier** les contraintes uniques (`@@unique`)
- **Analyser** les relations avec d'autres modèles
- **Déterminer** les champs obligatoires vs optionnels

### 1.2. Règles critiques pour les filtres de recherche

**Pour les champs ENUM :**
- ❌ JAMAIS utiliser `contains` ou `mode: "insensitive"`
- ✅ Utiliser uniquement `equals` ou `in`

**Pour les champs STRING :**
- ✅ Utiliser `contains` et `mode: "insensitive"`

```ts
// ✅ CORRECT
{ name: { contains: search, mode: "insensitive" } }  // String
{ action: { equals: search } }                       // Enum

// ❌ INCORRECT
{ action: { contains: search } }                     // Enum avec contains
```

---

## 2. STRATÉGIE D'IDENTIFICATION POUR EXCEL

### 2.1. Règle fondamentale
**TOUJOURS utiliser des champs métier pour l'identification, jamais l'ID technique Prisma**

### 2.2. Ordre de priorité pour l'identifiant unique

1. **Contrainte avec entrepriseId** : `@@unique([champ_metier, entrepriseId])`
   - Utiliser `champ_metier` uniquement (entrepriseId automatique)
   - Exemple : `@@unique([name, entrepriseId])` → identification par "name"

2. **Contrainte simple** : `@@unique([champ_metier])`
   - Utiliser `champ_metier` comme identifiant
   - Exemple : `@@unique([code])` → identification par "code"

3. **Plusieurs contraintes** :
   - Privilégier celle avec `entrepriseId`
   - Sinon, utiliser la plus "métier" (nom, code, référence)

4. **Pas de contrainte unique** :
   - Identifier le meilleur champ métier : `name`, `code`, `reference`, `libelle`
   - Si aucun champ évident, utiliser une combinaison de champs

### 2.3. Règle entrepriseId
- **entrepriseId n'est JAMAIS inclus dans les fichiers Excel**
- Il est automatiquement récupéré via la session utilisateur
- Toutes les opérations API filtrent automatiquement par entrepriseId

---

## 3. STRUCTURE DES FICHIERS À CRÉER

### 3.1. Pages principales
```
app/[locale]/(main)/[resource_name]/
├── page.tsx                                    # Page principale avec ViewMode
└── _components/
    ├── new-[resource].tsx                      # Dialog création
    ├── edit-[resource].tsx                     # Dialog modification  
    ├── delete-[resource].tsx                   # Dialog suppression
    ├── [resource]-row-actions.tsx              # Actions par ligne
    ├── [Resource]Import.tsx                    # Import Excel création
    └── [Resource]UpdateImport.tsx              # Import Excel modification
```

### 3.2. Schémas de validation
```
lib/validation/
├── [resource]-import.schema.ts                # Validation import création
└── [resource]-update-import.schema.ts         # Validation import modification
```

### 3.3. Endpoints API
```
app/api/[resource_name]/
├── route.ts                                    # GET (liste), POST (création)
├── [id]/route.ts                               # GET, PUT, DELETE
├── import/route.ts                             # POST (import), GET (template)
└── update-import/route.ts                      # POST (update), GET (template)
```

---

## 4. FONCTIONNALITÉS OBLIGATOIRES

### 4.1. CRUD complet
- ✅ **Création** : Formulaire avec validation Yup
- ✅ **Lecture** : Tableau avec pagination et recherche
- ✅ **Modification** : Formulaire d'édition ET importation Excel
- ✅ **Suppression** : Dialog avec vérification des dépendances

### 4.2. Importation Excel
- ✅ **Création** : Importer nouvelles ressources depuis Excel
- ✅ **Modification** : Modifier ressources existantes depuis Excel
- ✅ **Templates** : Génération automatique templates Excel
- ✅ **Validation** : Messages d'erreur détaillés
- ✅ **Mapping** : Colonnes Excel → champs métier (pas les IDs)

### 4.3. Architecture technique
- ✅ **TypeScript strict** avec types Prisma
- ✅ **Yup validation** pour tous les formulaires
- ✅ **RBAC permissions** avec middleware protection
- ✅ **EntrepriseId filtering** dans tous les endpoints
- ✅ **Toast notifications** pour feedback utilisateur
- ✅ **Loading states** avec spinners
- ✅ **Responsive design** avec Tailwind CSS
- ✅ **Error handling** centralisé
- ✅ **Internationalisation** (fr/ar)

### 4.4. UI/UX cohérente
- ✅ **shadcn/ui components** (Button, Card, Table, Dialog)
- ✅ **Lucide icons** pour l'interface
- ✅ **Sonner toasts** pour notifications
- ✅ **ViewMode** : "list" | "import" | "update-import"
- ✅ **Navigation** fluide entre les vues

---

## 5. ⚠️ RÈGLES CRITIQUES POUR LES TEMPLATES EXCEL

### 5.1. ERREUR FATALE À ÉVITER
**NE JAMAIS retourner du JSON pour les templates Excel**

```ts
// ❌ INCORRECT - Corrompt le fichier Excel
export async function GET(request: NextRequest) {
  const template = { columns: [...], exampleRows: [...] };
  return NextResponse.json(template); // ❌ Fichier corrompu !
}
```

### 5.2. IMPLEMENTATION CORRECTE
**Toujours générer un fichier binaire XLSX**

```ts
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const protectionError = await protectReadRoute(request, the_resource);
    if (protectionError) return protectionError;

    const session = await getSession();
    const entrepriseId = session?.entrepriseId;

    // Récupérer données de référence
    const relatedData = await prisma.[related_model].findMany({
      where: { entrepriseId },
      select: { name: true },
    });

    // Créer données du template avec exemples réels
    const templateData = [
      {
        "Colonne 1*": "Exemple 1",
        "Colonne 2*": relatedData[0]?.name || "Exemple",
      },
      {
        "Colonne 1*": "Exemple 2", 
        "Colonne 2*": relatedData[0]?.name || "Exemple",
      },
    ];

    // Créer workbook XLSX
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Ajouter commentaires Excel sur les en-têtes
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:Z1");
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      const header = worksheet[cellAddress].v;
      let comment = "";

      if (header.includes("Colonne 1")) {
        comment = "Obligatoire. Description de la colonne 1.";
      } else if (header.includes("Colonne 2")) {
        comment = "Obligatoire. Valeurs disponibles: " + 
          relatedData.map(r => r.name).join(", ");
      }

      if (comment) {
        worksheet[cellAddress].c = [
          { t: comment, r: "<r><rPr><b/></rPr><t>" + comment + "</t></r>" },
        ];
      }
    }

    // ✅ Générer le fichier binaire XLSX
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // ✅ Retourner en tant que fichier Excel binaire
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=[resource_name]_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Erreur GET template:", error);
    return NextResponse.json(
      { message: "Erreur lors de la génération du template" },
      { status: 500 }
    );
  }
}
```

### 5.3. Checklist obligatoire pour les templates
- ✅ Importer `XLSX` du package `xlsx`
- ✅ Utiliser `XLSX.utils.json_to_sheet()` pour créer la feuille
- ✅ Utiliser `XLSX.utils.book_new()` et `XLSX.utils.book_append_sheet()`
- ✅ Utiliser `XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })`
- ✅ Retourner avec `new NextResponse(buffer, { headers: {...} })`
- ✅ Headers obligatoires :
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename=[resource]_template.xlsx`
- ✅ Jamais retourner JSON pour les templates
- ✅ Pré-remplir avec données réelles de la BD
- ✅ Ajouter commentaires Excel sur les en-têtes

---

## 6. PATTERNS D'IMPLÉMENTATION

### 6.1. Patterns de composants
- **Structure identique** à la page sites
- **ViewMode management** pour navigation entre vues
- **Formulaires réactifs** avec @tanstack/react-form
- **Gestion d'erreur** centralisée avec FormError
- **Toast notifications** pour feedback utilisateur

### 6.2. Patterns API
- **Protection RBAC** sur tous les endpoints
- **EntrepriseId filtering** automatique
- **Validation des entrées** avec schémas Yup
- **Gestion des dépendances** avant suppression
- **Logging des opérations** d'importation

### 6.3. Patterns de validation
- **Schémas Yup** pour tous les formulaires
- **Messages d'erreur** internationalisés
- **Validation des relations** (mapping code/name → ID)
- **Gestion des doublons** via contraintes uniques

---

## 7. PROCESSUS D'EXÉCUTION

### 7.1. Ordre de traitement
1. **Analyser** `prisma/schema.prisma`
2. **Pour chaque ressource** dans `LISTE_RESSOURCES` :
   a. **Extraire** informations du modèle
   b. **Déterminer** stratégie d'identification
   c. **Créer** fichiers de page et composants
   d. **Créer** schémas de validation
   e. **Créer** endpoints API
   f. **Valider** cohérence globale
   g. **Corriger** les erreurs identifiées
3. **Fournir** résumé complet des créations

### 7.2. Références d'adaptation
Pour chaque ressource, adapter ces références :
- Page principale : `sites/page.tsx` → `[resource]/page.tsx`
- Import : `sites/_components/SiteImport.tsx` → `[resource]/_components/[Resource]Import.tsx`
- UpdateImport : `sites/_components/SiteUpdateImport.tsx` → `[resource]/_components/[Resource]UpdateImport.tsx`
- Schéma : `lib/validation/site-import.schema.ts` → `lib/validation/[resource]-import.schema.ts`
- API import : `sites/import/route.ts` → `[resource]/import/route.ts`
- API update : `sites/update-import/route.ts` → `[resource]/update-import/route.ts`

---

## 8. OUTPUT ATTENDU

Pour chaque ressource dans `LISTE_RESSOURCES` :
- ✅ **Confirmation** de l'analyse du modèle Prisma
- ✅ **Création** de tous les fichiers requis
- ✅ **Validation** de la cohérence avec l'architecture existante
- ✅ **Résumé** des fonctionnalités implémentées
- ✅ **Vérification** de l'absence d'erreurs critiques

---

**Note importante** : Ce prompt doit s'exécuter en batch pour toutes les ressources fournies, en adaptant automatiquement chaque implémentation selon la structure spécifique du modèle Prisma correspondant. Toutes les erreurs identifiées dans les implémentations précédentes doivent être évitées.
