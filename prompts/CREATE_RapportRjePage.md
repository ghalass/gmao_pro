set default language of our conversation to french

Parfait 👍
Ci-dessous, je te propose **un prompt prêt à l’emploi**, clair, structuré et exploitable tel quel pour un **AI Agent développeur**.
Il est rédigé pour forcer l’agent à **bien lire le `schema.prisma`**, respecter **Next.js + Prisma**, et reproduire **tes bonnes pratiques existantes** (API, hooks, tables, virtualisation).

Tu peux **copier-coller intégralement** ce prompt.

---

## 🎯 PROMPT POUR AGENT IA – CRÉATION `RapportRjePage`

```
Tu es un développeur senior Next.js / React / Prisma.

OBJECTIF GLOBAL
Créer une page Next.js nommée `RapportRjePage` qui affiche le Rapport Journalier des Engins (RJE),
en te basant STRICTEMENT sur :
- le `schema.prisma` fourni
- les bonnes pratiques déjà utilisées dans le projet
- l’exemple de page TypeparcsPage fourni (gestion API, loading, error, structure React)

IMPORTANT
- Lis attentivement TOUT le schema.prisma avant de coder
- Ne fais aucune hypothèse hors schéma
- Respecte les relations Site → Parc → Engin
- Le code doit être PRODUCTION-READY

---

## 1️⃣ PAGE À CRÉER

Créer la page :
```

app/[locale]/(main)/rapports/rje/page.tsx

````

Composant principal :
```ts
function RapportRjePage()
````

Page CLIENT (`"use client"`).

---

## 2️⃣ FONCTIONNALITÉS DE LA PAGE

### 🔹 Sélection de date

* Un date picker permettant de choisir un **jour**
* Cette date sert de référence pour :

  * le JOUR (J)
  * le MOIS (M)
  * le CUMUL ANNUEL (C)

---

### 🔹 Structure du tableau

Tableau avec :

* Filtrage global
* Filtrage par colonnes
* Affichage hiérarchique logique :

  * Site

    * Parc

      * Engin

Chaque **engin** affiche les indicateurs suivants :

| ENGINS | DISP J | DISP M | DISP C | TDM J | TDM M | TDM C | MTBF M | MTBF C |

---

## 3️⃣ SOURCES DE DONNÉES (OBLIGATOIRES)

### 🔹 HRM

* Table : `Saisiehrm`
* Champ : `hrm`
* Relation : `Saisiehrm → Engin → Parc → Site`

### 🔹 HIM & NI

* Table : `Saisiehim`
* Champs :

  * `him`
  * `ni`
* Reliée à `Saisiehrm`

### 🔹 Objectifs

* Table : `Objectif`
* Filtrer par :

  * `annee`
  * `siteId`
  * `parcId`
* Champs utilisés :

  * `dispo`
  * `tdm`
  * `mtbf`

---

## 4️⃣ FORMULES DE CALCUL (À RESPECTER STRICTEMENT)

NHO = 24 heures × nombre de jours

HRD = NHO - (HIM + HRM)

MTTR = HIM / NI

DISP (%) = (1 - (HIM / NHO)) × 100

TDM (%) = (HRM / NHO) × 100

MTBF (H) = HRM / NI

UTIL (%) = HRM / (HRM + HRD) × 100

⚠️ Gérer les divisions par zéro proprement

---

## 5️⃣ PÉRIMÈTRES DE CALCUL

Pour chaque engin :

* JOUR : données du jour sélectionné
* MOIS : du 1er jour du mois jusqu’à la date sélectionnée
* CUMUL ANNUEL : du 1er janvier jusqu’à la date sélectionnée

---

## 6️⃣ API À CRÉER

Créer une API dédiée (ex: `app/api/rapports/rje`) qui :

* Reçoit la date sélectionnée
* Agrège les données côté serveur (Prisma)
* Retourne une structure prête pour l’affichage
* Optimisée (groupBy, reduce, pas de logique lourde côté client)

---

## 7️⃣ HOOKS À CRÉER

Créer les hooks nécessaires, par exemple :

* `useRapportRje(date)`
* Gestion :

  * loading
  * error
  * refresh

S’inspirer STRICTEMENT de la page `app/[locale]/(main)/typeparcs/page.tsx` :

* `apiFetch`
* gestion d’erreurs
* structure du state

---

## 8️⃣ UI / UX

* Utiliser les composants Shadcn UI (`Table`, `Card`, `Spinner`, etc.)
* Afficher une ligne "OBJ." à la fin du tableau avec les objectifs agrégés
* Afficher des états :

  * loading
  * vide
  * erreur

---

## 9️⃣ LIVRABLES ATTENDUS

1. Page `RapportRjePage` complète
2. API Prisma complète
3. Hooks React complets
4. Types TypeScript
5. Code clair, commenté et maintenable

---

NE PAS :

* inventer des champs
* ignorer le schema
* faire de calculs approximatifs
* mettre toute la logique dans le composant React

RÉSULTAT ATTENDU
Une page identique fonctionnellement à un rapport RJE industriel réel,
capable de produire un tableau comme l’exemple fourni (J / M / C / OBJ).

```