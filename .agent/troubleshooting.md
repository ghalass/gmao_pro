# Guide de dépannage - Sites et Typeparcs

## Erreur actuelle : "Cannot read properties of undefined (reading 'displayName')"

### Solution rapide :

1. **Arrêter le serveur** (Ctrl+C dans le terminal)
2. **Supprimer le cache Next.js** :
   ```bash
   rmdir /s /q .next
   ```
3. **Régénérer le client Prisma** :
   ```bash
   npx prisma generate
   ```
4. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

## Autres solutions possibles :

### Si l'erreur persiste après le redémarrage :

**Option 1 : Vérifier que toutes les dépendances sont installées**

```bash
npm install
```

**Option 2 : Nettoyer complètement et réinstaller**

```bash
rmdir /s /q node_modules
rmdir /s /q .next
npm install
npx prisma generate
npm run dev
```

### Si vous voyez "Module not found: @radix-ui/react-switch" :

```bash
npm install @radix-ui/react-switch
```

### Si vous voyez des erreurs de type Prisma :

```bash
npx prisma generate
npx prisma migrate dev
```

## Vérifications avant de tester :

### 1. Base de données

- [ ] PostgreSQL est démarré
- [ ] Les variables d'environnement DATABASE_URL sont correctes dans `.env`

### 2. Migrations

```bash
npx prisma migrate status
```

Si des migrations sont en attente :

```bash
npx prisma migrate dev
```

### 3. Permissions

Créer via `/fr/permissions` :

- `site:create`
- `site:read`
- `site:update`
- `site:delete`
- `typeparc:create`
- `typeparc:read`
- `typeparc:update`
- `typeparc:delete`

### 4. Rôles

Assigner les permissions créées à votre rôle via `/fr/roles`

## Test de fonctionnement :

### Sites

1. Aller sur `http://localhost:3000/fr/sites`
2. Cliquer sur "Nouveau site"
3. Remplir le formulaire :
   - Nom : "Carrière Nord"
   - Actif : Coché
4. Cliquer sur "Créer"
5. Vérifier que le site apparaît dans la liste
6. Tester "Modifier" et "Supprimer"

### Typeparcs

1. Aller sur `http://localhost:3000/fr/typeparcs`
2. Cliquer sur "Nouveau type de parc"
3. Remplir le formulaire :
   - Nom : "Engins de chantier"
4. Cliquer sur "Créer"
5. Vérifier que le type apparaît dans la liste
6. Tester "Modifier" et "Supprimer"

## Logs utiles :

### Vérifier les erreurs dans la console du navigateur (F12)

### Vérifier les logs du serveur dans le terminal

## Si tout fonctionne :

✅ Vous pouvez passer aux modèles suivants :

- Parc (dépend de Typeparc)
- Typepanne
- Panne (dépend de Typepanne)
- Engin (dépend de Parc + Site)
