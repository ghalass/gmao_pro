set default language of our conversation to french


D'abord bien lire le projet et comprendre l'ensemble du projet avec le schema.prisma.

# Prompt pour corriger le problème de rafraîchissement CRUD

## Contexte
Je dois corriger un problème où les données ne se rafraîchissent pas automatiquement après les opérations CRUD (Create, Update, Delete) sur plusieurs pages de l'application. L'utilisateur doit recharger manuellement la page pour voir les changements.

## Pattern de solution à appliquer
Pour chaque page avec des opérations CRUD, je dois :

1. **Vérifier la page principale** :
   - Confirmer qu'elle utilise une fonction de chargement de données (généralement `fetchData()` ou `refreshSites()`) 
   - Vérifier qu'elle passe cette fonction comme callback `onSuccess` aux composants de création et aux row-actions

2. **Vérifier le composant row-actions** :
   - Ajouter `on[Entity]Updated?: () => void;` à l'interface si absent
   - Passer ce callback comme `onSuccess` aux composants edit/delete

3. **Corriger les composants edit/delete** :
   - Ajouter `onSuccess?: () => void;` à l'interface si absent
   - Inclure `onSuccess` dans les props déstructurées
   - Appeler `onSuccess?.();` après `response.ok` dans les handlers de soumission

## Pages à vérifier et corriger
- [🗸] users
- [🗸] roles
- [🗸] permissions
- [🗸] engins
- [🗸] parcs
- [🗸] typeparcs
- [🗸] sites
- [🗸] pannes
- [🗸] typepannes
- [🗸] lubrifiants
- [🗸] typelubrifiants
- [🗸] typeconsommationlubs
- [🗸] objectifs
- [🗸] organes
- [🗸] typeorganes

## Instructions
- Appliquer le pattern ci-dessus à chaque page de la liste
- Ne pas modifier les pages qui sont déjà correctes
- Tester que chaque modification suit exactement le pattern établi