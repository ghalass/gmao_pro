D'abord bien lire le projet et comprendre l'ensemble du projet avec le schema.prisma.

- Analyser le fichier schema.prisma afin d’identifier le modèle organes et ses relations.
- Parcourir l’ensemble du projet pour comprendre l’implémentation existante de la page de gestion des utilisateurs (Users) :

* structure des composants
* logique CRUD
* gestion d’état
* formulaires, validations et UI

- Créer une page complète de gestion des rôles en reproduisant exactement la même architecture et les mêmes bonnes pratiques utilisées pour les utilisateurs, en les adaptant au contexte des organes.
- Assurer la cohérence avec :

* le style UI existant
* les conventions du projet
* la logique métier et les permissions liées aux organes.

- s'assure que tout les endpoint traitent par rapport au entrepriseId
- Gère les relations entre les modèles (de tout type, ManyToOne, OneToMany, ManyToMany), implicite et explicite

<!-- TRANSL -->

faire la traduction des pages dèjà terminées et qui ne sont pas traduite, comme ce qui fait avec

---

dans saisiehrms : rajoute la possibilité d'associer des consommations des lubrifiants (saisie_lubrifiant) à la saisiehim avec un type de consommation (chaque type de consommation est associé à un parc), lire mon projet et le schema.prisma


<!-- importer les données CRUD à travers un fichier Excel -->
D'abord bien lire le projet et comprendre l'ensemble du projet avec le schema.prisma.
crée un option de faire CRUD du modèle "site" à travers un fichier excel et gère les relations avec les autres modèles en tenant compte des contraintes de clés étrangères et des validations nécessaires pour maintenir l'intégrité des données, tout en assurant la traçabilité des modifications et la gestion des erreurs d'importation.
crée un fichier excel standard à utiliser pour ce système d'importation.