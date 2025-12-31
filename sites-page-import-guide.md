# Page Sites avec Importation Excel - Guide d'Utilisation

## 🎯 Vue d'ensemble

La page des sites intègre maintenant un système d'importation Excel complet avec deux modes de vue : liste et importation. L'utilisateur peut basculer facilement entre la gestion manuelle et l'importation massive.

## 🔄 Modes de Vue

### 1. Mode Liste (par défaut)
- Affiche tous les sites existants
- Statistiques en temps réel
- Recherche et filtrage
- Actions rapides (importer, actualiser, exporter)
- Gestion individuelle des sites

### 2. Mode Importation
- Interface complète d'importation Excel
- Template téléchargeable
- Validation et traitement des fichiers
- Statistiques actuelles affichées
- Retour automatique après succès

## 🎨 Interface Utilisateur

### Header principal
```
Sites                                    [Importer Excel] [Nouveau Site]
Gérez vos sites et importez-les en masse depuis Excel
```

### Statistiques (4 cartes)
- Total des sites
- Sites actifs (vert)
- Sites inactifs (rouge)
- Total engins

### Actions rapides
- **Importer des sites** → Bascule en mode importation
- **Actualiser la liste** → Recharge les données
- **Exporter la liste** → Export Excel (à implémenter)

### Liste des sites
Pour chaque site :
- Nom + badge Actif/Inactif
- Nombre d'engins
- Date de création
- Date de mise à jour
- Actions : Désactiver/Activer + Menu

## 📊 Workflow d'Importation

### Étape 1: Accès à l'importation
1. Cliquer sur "Importer Excel" dans le header
2. Ou cliquer sur "Importer des sites" dans les actions rapides

### Étape 2: Interface d'importation
```
← Retour à la liste des sites
Importation de Sites
Importez des sites en masse depuis un fichier Excel        [Actualiser]

[Composant SiteImport complet]

Statistiques actuelles
┌─────────┬─────────┬─────────┐
│ Total   │ Actifs  │ Engins  │
│ sites   │         │         │
└─────────┴─────────┴─────────┘
```

### Étape 3: Processus d'importation
1. **Télécharger le template** → Format Excel requis
2. **Remplir le fichier** → Données des sites
3. **Uploader le fichier** → Drag & drop ou sélection
4. **Validation** → Vérification automatique
5. **Traitement** → Création/mise à jour
6. **Résultats** → Résumé et erreurs

### Étape 4: Post-importation
- **Succès** : Retour automatique après 2 secondes
- **Erreur** : Reste en mode importation pour correction
- **Rafraîchissement** : Liste mise à jour automatiquement

## 🔧 Fonctionnalités Techniques

### State Management
```typescript
type ViewMode = "list" | "import";

const [viewMode, setViewMode] = useState<ViewMode>("list");
const [sites, setSites] = useState<Site[]>([]);
const [refreshKey, setRefreshKey] = useState(0);
```

### Gestion du rafraîchissement
```typescript
// Après importation réussie
setTimeout(() => {
  setViewMode("list");
  setRefreshKey(prev => prev + 1);
}, 2000);
```

### Callback d'importation
```typescript
const handleImportComplete = (result: any) => {
  if (result.success) {
    toast.success(`Importation réussie: ${result.summary?.created} créés`);
    // Retour auto + rafraîchissement
  } else {
    toast.error(`Importation partielle: ${result.summary?.errors} erreurs`);
  }
};
```

## 🎯 Points d'Intégration

### Boutons d'accès à l'importation
1. Header principal : "Importer Excel"
2. Actions rapides : "Importer des sites"
3. État vide : "Importer des sites"

### Navigation
- **Flèche retour** : Mode importation → liste
- **Auto-retour** : Après succès (2s)
- **Manuel** : Bouton retour disponible

### Statistiques en mode importation
Affiche les données actuelles pour contexte :
- Total sites existants
- Sites actifs
- Total engins

## 📱 Responsive Design

### Desktop (>768px)
- Grille 4 colonnes pour statistiques
- Layout horizontal pour actions
- Liste complète avec toutes les informations

### Mobile (<768px)
- Grille 2 colonnes pour statistiques
- Layout vertical pour actions
- Liste compacte

## 🚀 Avantages de cette intégration

### ✅ Expérience utilisateur fluide
- Navigation transparente entre modes
- Contexte préservé (statistiques visibles)
- Retour automatique après succès

### ✅ Gestion d'état cohérente
- Rafraîchissement automatique
- Évite les données obsolètes
- Maintient la recherche/filtre

### ✅ Actions rapides accessibles
- Multiple points d'entrée
- Raccourcis clairs
- Feedback immédiat

### ✅ Gestion d'erreur robuste
- Messages toast informatifs
- Reste en mode importation si erreur
- Possibilité de retenter

## 🔄 Cycle de Vie

1. **Chargement initial** → Mode liste
2. **Action importer** → Mode importation
3. **Télécharger template** → Préparation fichier
4. **Uploader fichier** → Traitement
5. **Succès** → Retour auto + rafraîchissement
6. **Erreur** → Stay importation + correction

## 📈 Métriques et Feedback

### Toast notifications
- Succès : "Importation réussie: X sites créés, Y mis à jour"
- Erreur : "Importation partielle: X erreurs"
- Action : "Statut du site mis à jour"

### Indicateurs visuels
- Loading spinner pendant chargement
- Barre de progression importation
- Badges de statut (Actif/Inactif)
- Icônes contextuelles

## 🎯 Conclusion

L'intégration du système d'importation Excel dans la page sites offre une expérience utilisateur complète et intuitive. Les utilisateurs peuvent gérer leurs sites manuellement ou en masse selon leurs besoins, avec une navigation fluide et un feedback approprié à chaque étape.
