// locales/fr.ts
export default {
  common: {
    loading: "Chargement en cours...",
  },
  pages: {
    notFoundPage: {
      title: "Oups ! Perdu ?",
      message:
        "Cette page semble avoir disparu dans la nature. Revenons sur le bon chemin.",
      buttonText: "Retour à l'accueil",
      info: "Si le problème persiste, contactez notre support.",
    },
    home: {
      welcome: "Gérer la maintenance ne devrait pas être complexe.",
      description: "Pilotez votre maintenance simplement et efficacement.",
      sub_description:
        "Notre GMAO-Pro vous permet de centraliser toutes vos données, de planifier vos opérations et de prendre de meilleures décisions grâce à des indicateurs clairs et exploitables.",

      question1: {
        title: "Prêt à simplifier votre maintenance ?",
        subTitle:
          "Découvrez comment notre GMAO-Pro peut transformer votre quotidien.",
        buttonTitle: "Commencer maintenant",
      },
      question2: {
        title: "Vous avez dèjà une application ?",
        buttonTitle: "Se connecter maintenant",
      },
      ifConnected: {
        welcome: "Bienvenue",
        buttonTitle: "Allez au Tableau de bord principal",
      },
    },
    register: {
      title: "Créer une application GMAO pour votre entreprise",
      description: "Remplissez le formulaire pour créer votre application.",
      entrepriseName: "Nom de votre Entreprise",
      name: "Votre Nom",
      email: "Votre Email",
      password: "Votre mot de passe",
      lang: {
        label: "Langue",
        text: "Choisir une langue",
      },
      footer: {
        resetButtonText: "Effacer tout",
        submitButton: {
          text: "S'inscrire",
          processingText: "Création...",
        },
        question: {
          text: "Déjà une application ?",
          linkText: "Se connecter",
        },
        linkText: "Retour à la page d'accueil",
      },
    },
    login: {
      title: "Se connecter",
      description: "Entrez vos identifiants pour accéder à votre application.",
      entrepriseName: "Nom de votre Entreprise",
      email: "Votre Email",
      password: "Votre mot de passe",
      footer: {
        resetButtonText: "Effacer tout",
        submitButton: {
          text: "Se connecter",
          processingText: "Connexion...",
        },
        question: {
          text: "Pas de compte ?",
          linkText: "S'inscrire",
        },
        linkText: "Retour à la page d'accueil",
      },
    },
    profile: {
      title: "Mon Profil",
      subTitle: "Gérez vos informations personnelles et vos préférences",
      editButtonText: "Modifier le profil",
      saveButtonText: "Sauvegarder",
      cancelButtonText: "Annuler",
      infoPerso: {
        title: "Informations personnelles",
        subTitle: "Mettez à jour vos informations de compte",
        membreDepuis: "Membre depuis",
        nomComplet: "Nom complet *",
        nomCompletSubTitle: "Ce nom sera affiché dans l'application",
        email: "Adresse email *",
        emailSubTitle: "Utilisée pour la connexion",
        successMessage: "Profil mis à jour avec succès",
      },
      passwordChange: {
        title: "Changer le mot de passe",
        subTitle: "Mettez à jour votre mot de passe de connexion",
        actuelPassword: "Mot de passe actuel *",
        newPassword: "Nouveau mot de passe *",
        newPasswordSub: "Minimum 6 caractères",
        confrimPassword: "Confirmer le mot de passe *",
        buttonTitle: "Changer le mot de passe",
        check: {
          currentPasswordRequired: "Le mot de passe actuel est requis",
          newPasswordRequired: "Le nouveau mot de passe est requis",
          newPasswordLength:
            "Le mot de passe doit contenir au moins 6 caractères",
          newPasswordMatch: "Les mots de passe ne correspondent pas",
        },
        successMessage: "Mot de passe changé avec succès",
      },
      roleAndPermissions: {
        title: "Rôles et permissions",
        subTitle: "Vos accès dans l'application",
        notRoles: "Aucun rôle",
        titleBody: "Rôles attribués",
        lastUpdate: "Dernière mise à jour",
      },
    },
    dashboard: {
      title: "Tableau de bord",
    },
    about: {
      title: "À propos",
    },
    users: {
      title: "Utilisateurs",
      subtitle: "{count} utilisateur{plural}",
      table: {
        user: "Utilisateur",
        email: "Email",
        role: "Rôle",
        status: "Statut",
        creationDate: "Date création",
        noUsers: "Aucun utilisateur",
        noRole: "Aucun rôle",
        active: "Actif",
        inactive: "Inactif",
        superAdmin: "Super Admin",
      },
    },
    roles: {
      title: "Rôles et Permissions",
      subtitle: "{count} rôle{plural} configuré{plural}",
      table: {
        role: "Rôle",
        description: "Description",
        permissions: "Permissions",
        users: "Utilisateurs",
        noRoles: "Aucun rôle",
        noDescription: "Aucune description",
        noPermissions: "Aucune permission",
      },
    },
    parcs: {
      title: "Gestion des Parcs",
      subtitle: "{count} parc{plural} configuré{plural}",
      table: {
        name: "Nom du Parc",
        type: "Type de Parc",
        possiblePannes: "Pannes possibles",
        attachedEngins: "Engins rattachés",
        noParcs: "Aucun parc configuré",
        notDefined: "Non défini",
        noPanne: "Aucune panne",
        engins: "engins",
      },
    },
    engins: {
      title: "Gestion des Engins",
      subtitle: "{count} engin{plural} répertorié{plural}",
      table: {
        nameCode: "Nom / Code",
        parc: "Parc",
        currentSite: "Site Actuel",
        status: "Statut",
        initialHours: "Heures Initiales",
        noEngins: "Aucun engin configuré",
        noParc: "Sans parc",
        noSite: "Sans site",
        active: "Actif",
        inactive: "Inactif",
      },
    },
    pannes: {
      title: "Gestion des Pannes",
      subtitle: "{count} panne{plural} référencée{plural}",
      table: {
        name: "Nom de la Panne",
        type: "Type de Panne",
        associatedParcs: "Parcs associés",
        description: "Description",
        linkedSaisies: "Saisies liées",
        noPannes: "Aucune panne configurée",
        notDefined: "Non défini",
        noParcAssociated: "Aucun parc associé",
        saisies: "saisies",
      },
    },
    sites: {
      title: "Gestion des Sites",
      subtitle: "{count} site{plural} configuré{plural}",
      table: {
        name: "Nom du Site",
        status: "Statut",
        attachedEngins: "Engins rattachés",
        noSites: "Aucun site configuré",
        active: "Actif",
        inactive: "Inactif",
        engins: "engins",
      },
    },
    permissions: {
      title: "Gestion des Permissions",
      subtitle: "{count} permission{plural} définie{plural}",
      table: {
        permission: "Permission",
        resource: "Ressource",
        action: "Action",
        description: "Description",
        linkedRoles: "Rôles liés",
        noPermissions: "Aucune permission",
        noRole: "Aucun rôle",
      },
    },
    saisiehrms: {
      title: "Saisies HRM",
      subtitle:
        "Gérez et suivez les heures de marche des engins et les interventions associées.",
    },
    lubrifiants: {
      title: "Gestion des Lubrifiants",
      subtitle: "{count} lubrifiant{plural} configuré{plural}",
      table: {
        name: "Nom du Lubrifiant",
        type: "Type",
        associatedParcs: "Parcs associés",
        creationDate: "Date création",
        noLubrifiants: "Aucun lubrifiant configuré",
        notDefined: "Non défini",
        noParc: "Aucun parc",
      },
    },
    typelubrifiants: {
      title: "Types de Lubrifiants",
      subtitle: "{count} type{plural} configuré{plural}",
      table: {
        name: "Nom du Type",
        associatedLubrifiants: "Lubrifiants associés",
        creationDate: "Date création",
        noTypes: "Aucun type de lubrifiant configuré",
        lubrifiants: "lubrifiant{plural}",
      },
    },
    typepannes: {
      title: "Types de Panne",
      subtitle: "{count} type{plural} configuré{plural}",
      table: {
        name: "Nom du Type",
        description: "Description",
        associatedPannes: "Pannes associées",
        noTypes: "Aucun type de panne configuré",
        pannes: "pannes",
      },
    },
    typeparcs: {
      title: "Types de Parc",
      subtitle: "{count} type{plural} configuré{plural}",
      table: {
        name: "Nom du Type",
        associatedParcs: "Parcs associés",
        noTypes: "Aucun type de parc configuré",
        parcs: "parcs",
      },
    },
    typeorganes: {
      title: "Types d'Organes",
      subtitle: "{count} type{plural} configuré{plural}",
      table: {
        name: "Nom du Type",
        associatedParcs: "Parcs associés",
        associatedOrganes: "Organes associés",
        noTypes: "Aucun type d'organe configuré",
        parcs: "parcs",
        organes: "organes",
        noParc: "Aucun parc",
        noOrgane: "Aucun organe",
      },
    },
    organes: {
      title: "Gestion des Organes",
      subtitle: "{count} organe{plural} répertorié{plural}",
      table: {
        name: "Nom de l'Organe",
        type: "Type d'Organe",
        marque: "Marque",
        sn: "S/N",
        status: "Statut",
        creationDate: "Date de création",
        noOrganes: "Aucun organe configuré",
        active: "Actif",
        inactive: "Inactif",
      },
    },
    objectifs: {
      title: "Objectifs",
      subtitle: "{count} objectif{plural}",
      table: {
        year: "Année",
        parc: "Parc",
        site: "Site",
        dispo: "Dispo",
        mtbf: "MTBF",
        tdm: "TDM",
        specifications: "Spécifications",
        noObjectifs: "Aucun objectif",
        oil: "Huile",
        go: "GO",
        grease: "Graisse",
      },
    },
  },
  navbar: {
    authButtons: {
      login: "Se connecter",
      register: "S'inscrire",
      noRoleText: "Aucun rôle",
      rolesTitle: "Rôles",
      profile: "Mon profil",
      logout: "Déconnexion",
    },
  },
  sidebar: {
    dashboard: {
      title: "Dashboard",
      description: "Tableau de bord principal",
    },
    saisiehrm: {
      title: "Saisies HRM",
      description: "Gérer les saisies HRM",
    },
  },
  apis: {
    common: {
      checkBody: "Le corps de la requête ne doit pas être vide",
    },
    auth: {
      login: {
        checkExistEntrepiseName: "Ce nom d'entreprise n'existe pas",
        emailOrPasswordIncorrect: "Email ou mot de passe incorrect!",
        inActiveAccount:
          "Votre compte n'est pas encore activé, veuillez contacter un admin pour l'activation.",
      },
      register: {
        checkExistEntrepiseName: "Ce nom d'entrprise est déjà utilisé",
        emailUsed: "Ce email est déjà utilisé",
      },
    },
  },
} as const;
