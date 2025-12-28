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
} as const;
