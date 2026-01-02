# 📋 Prompt d'Application du Système de Permissions

## 🎯 Objectif
Appliquer le système de permissions de manière cohérente sur les pages du projet en suivant le pattern établi dans la page sites.

## 📝 Liste des pages à traiter
```yaml
pages:
  - engins
  - parcs  
  - lubrifiants
  - pannes
  - organes
  - objectifs
  - typepannes
  - typelubrifiants
  - typeconsommationlubs
  - utilisateurs
  - roles
  - typeparcs
  - users
  - permissions
  - typeorganes
  - sites
```

## 🔍 Pattern de référence (Page sites)
Analyser la page `app/[locale]/(main)/sites/page.tsx` et son composant `sites/_components/site-row-actions.tsx` pour comprendre le pattern:

### 1. Hook de permissions
```tsx
import { useSitePermissions } from "@/hooks/usePermissions";
const permissions = useSitePermissions();
```

### 2. Contrôles dans la page principale
- Boutons d'action contrôlés par `permissions.create` et `permissions.update`
- Message d'erreur si `permissions.read = false`
- Export Excel est visible uniquement si `permissions.read = true`

### 3. Contrôles dans le composant d'actions
- Menu dropdown entièrement caché si ni `update` ni `delete`
- Actions individuelles contrôlées par leurs permissions spécifiques

## 🛠️ Tâches d'exécution

### Pour chaque page dans la liste:

#### Étape 1: Modifier la page principale
1. **Ajouter l'import du hook de permissions**
   ```tsx
   import { use[Page]Permissions } from "@/hooks/usePermissions";
   ```

2. **Ajouter l'état des permissions**
   ```tsx
   const permissions = use[Page]Permissions();
   ```

3. **Appliquer les contrôles conditionnels**
   - Entourer les boutons "Importer Excel" avec `{permissions.create && (...)}`
   - Entourer les boutons "Modifier Excel" avec `{permissions.update && (...)}`
   - Entourer les boutons "Nouveau [Page]" avec `{permissions.create && (...)}`
   - Modifier le message d'état vide pour vérifier `permissions.read`

#### Étape 2: Modifier le composant row-actions
1. **Ajouter l'import du hook de permissions**
   ```tsx
   import { use[Page]Permissions } from "@/hooks/usePermissions";
   ```

2. **Ajouter l'état des permissions**
   ```tsx
   const permissions = use[Page]Permissions();
   ```

3. **Appliquer les contrôles conditionnels**
   - Entourer tout le DropdownMenu avec `{(permissions.update || permissions.delete) && (...)}`
   - Entourer l'action "Modifier" avec `{permissions.update && (...)}`
   - Entourer l'action "Supprimer" avec `{permissions.delete && (...)}`

## 📋 Checklist de validation

Pour chaque page traitée:
- [ ] Hook de permissions importé et utilisé
- [ ] Boutons d'importation contrôlés par permissions.create
- [ ] Boutons de modification contrôlés par permissions.update  
- [ ] Boutons de création contrôlés par permissions.create
- [ ] Message d'erreur adapté si permissions.read = false
- [ ] Menu d'actions caché si ni update ni delete
- [ ] Actions individuelles contrôlées par leurs permissions
- [ ] Pattern cohérent avec la page sites

## ⚠️ Notes importantes
- Le nom du hook doit suivre le pattern: `use[Page]Permissions()` (ex: `useEnginPermissions()`)
- Vérifier que le hook existe bien dans `hooks/usePermissions.ts`
- Conserver la structure et le style existants
- Tester que les permissions fonctionnent correctement

## � Mode d'emploi
1. Choisir une page dans la liste ci-dessus
2. Remplacer `[Page]` par le nom de la page (ex: `Engins`, `Parcs`, etc.)
3. Exécuter les étapes 1 et 2 pour la page sélectionnée
4. Cocher la page dans la liste une fois terminée
5. Passer à la page suivante