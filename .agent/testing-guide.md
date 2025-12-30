# Script de test pour Site et Typeparc

## Étape 1 : Installer les dépendances manquantes

```bash
npm install @radix-ui/react-switch
```

## Étape 2 : Générer le client Prisma

```bash
npx prisma generate
```

## Étape 3 : Créer une migration pour la base de données

```bash
npx prisma migrate dev --name add_multi_tenancy_to_config_models
```

## Étape 4 : Démarrer le serveur de développement

```bash
npm run dev
```

## Étape 5 : Tester les fonctionnalités

### Sites

1. Accéder à `/fr/sites` (ou `/ar/sites`)
2. Cliquer sur "Nouveau site"
3. Créer un site (ex: "Carrière Nord")
4. Vérifier l'affichage dans la liste
5. Tester l'édition et la suppression

### Types de Parc

1. Accéder à `/fr/typeparcs` (ou `/ar/typeparcs`)
2. Cliquer sur "Nouveau type de parc"
3. Créer un type (ex: "Engins de chantier")
4. Vérifier l'affichage dans la liste
5. Tester l'édition et la suppression

## Notes importantes

### Permissions requises

Les utilisateurs doivent avoir les permissions suivantes :

- `site:create`, `site:read`, `site:update`, `site:delete`
- `typeparc:create`, `typeparc:read`, `typeparc:update`, `typeparc:delete`

### Création des permissions

Utilisez la page `/fr/permissions` pour créer ces permissions si elles n'existent pas encore.

### Multi-tenancy

- Chaque entreprise voit uniquement ses propres sites et types de parc
- Les noms doivent être uniques par entreprise (pas globalement)

## Problèmes potentiels et solutions

### Erreur : "Cannot find module @radix-ui/react-switch"

**Solution** : Exécuter `npm install @radix-ui/react-switch`

### Erreur de type Prisma

**Solution** : Exécuter `npx prisma generate` après toute modification du schema

### Erreur de migration

**Solution** : Vérifier que la base de données est accessible et que les migrations précédentes sont appliquées

### Erreur 401 (Non autorisé)

**Solution** : Vérifier que l'utilisateur est connecté et possède les permissions nécessaires
