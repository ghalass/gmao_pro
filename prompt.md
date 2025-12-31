- Analyser le fichier schema.prisma afin d’identifier le modèle typeconsommation_lub et ses relations.
- Parcourir l’ensemble du projet pour comprendre l’implémentation existante de la page de gestion des utilisateurs (Users) :

* structure des composants
* logique CRUD
* gestion d’état
* formulaires, validations et UI

- Créer une page complète de gestion des rôles en reproduisant exactement la même architecture et les mêmes bonnes pratiques utilisées pour les utilisateurs, en les adaptant au contexte des typeconsommation_lub.
- Assurer la cohérence avec :

* le style UI existant
* les conventions du projet
* la logique métier et les permissions liées aux typeconsommation_lub.

- s'assure que tout les endpoint traitent par rapport au entrepriseId
- Gère les relations entre les modèles (de tout type, ManyToOne, OneToMany, ManyToMany), implicite et explicite

<!-- TRANSL -->

faire la traduction des pages dèjà terminées et qui ne sont pas traduite, comme ce qui fait avec

---

dans saisiehrms : rajoute la possibilité d'associer des consommations des lubrifiants (saisie_lubrifiant) à la saisiehim avec un type de consommation (chaque type de consommation est associé à un parc), lire mon projet et le schema.prisma
