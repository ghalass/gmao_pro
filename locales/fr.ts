// locales/fr.ts
export default {
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
      },
      passwordChange: {
        title: "Changer le mot de passe",
        subTitle: "Mettez à jour votre mot de passe de connexion",
        actuelPassword: "Mot de passe actuel *",
        newPassword: "Nouveau mot de passe *",
        newPasswordSub: "Minimum 6 caractères",
        confrimPassword: "Confirmer le mot de passe *",
        buttonTitle: "Changer le mot de passe",
      },
      roleAndPermissions: {
        title: "Rôles et permissions",
        subTitle: "Vos accès dans l'application",
        notRoles: "Aucun rôle",
        titleBody: "Rôles attribués",
        lastUpdate: "Dernière mise à jour",
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
