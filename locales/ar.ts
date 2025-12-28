// locales/ar.ts
export default {
  pages: {
    notFoundPage: {
      title: "عفوًا! هل أنت تائه؟",
      message:
        "يبدو أن هذه الصفحة قد اختفت في مكان ما. لنعد إلى الطريق الصحيح.",
      buttonText: "العودة إلى الصفحة الرئيسية",
      info: "إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم.",
    },
    home: {
      welcome: "إدارة الصيانة لا يجب أن تكون معقدة.",
      description: "قم بإدارة صيانتك ببساطة وفعالية.",
      sub_description:
        "تتيح لك نظام إدارة الصيانة الخاص بنا GMAO-Pro مركزة جميع بياناتك، وتخطيط عملياتك، واتخاذ قرارات أفضل من خلال مؤشرات واضحة وقابلة للاستخدام.",
      question1: {
        title: "هل أنت مستعد لتبسيط صيانتك؟",
        subTitle: "اكتشف كيف يمكن لـ GMAO-Pro أن يغير روتينك اليومي.",
        buttonTitle: "ابدأ الآن",
      },
      question2: {
        title: "هل لديك بالفعل تطبيق؟",
        buttonTitle: "تسجيل الدخول الآن",
      },
      ifConnected: {
        welcome: "مرحبًا",
        buttonTitle: "اذهب إلى لوحة القيادة الرئيسية",
      },
    },
    register: {
      title: "إنشاء تطبيق نظام إدارة الصيانة باستخدام الحاسوب لشركتك",
      description: "املأ النموذج لإنشاء تطبيقك.",
      entrepriseName: "اسم الشركة",
      name: "اسمك",
      email: "بريدك الإلكتروني",
      password: "كلمة المرور",
      lang: {
        label: "اللغة",
        text: "اختر لغة",
      },
      footer: {
        resetButtonText: "محو لكل",
        submitButton: {
          text: "التسجيل",
          processingText: "جاري الإنشاء...",
        },
        question: {
          text: "هل لديك بالفعل تطبيق؟",
          linkText: "تسجيل الدخول",
        },
        linkText: "العودة إلى الصفحة الرئيسية",
      },
    },
    login: {
      title: "تسجيل الدخول",
      description: "أدخل بيانات الاعتماد الخاصة بك للوصول إلى تطبيقك.",
      entrepriseName: "اسم الشركة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      footer: {
        resetButtonText: "محو لكل",
        submitButton: {
          text: "تسجيل الدخول",
          processingText: "جاري الاتصال...",
        },
        question: {
          text: "ليس لديك حساب؟",
          linkText: "التسجيل",
        },
        linkText: "العودة إلى الصفحة الرئيسية",
      },
    },
    profile: {
      title: "ملفي الشخصي",
      subTitle: "إدارة معلوماتك الشخصية وتفضيلاتك",
      editButtonText: "تعديل الملف الشخصي",
      saveButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      infoPerso: {
        title: "المعلومات الشخصية",
        subTitle: "قم بتحديث معلومات حسابك",
        membreDepuis: "عضو منذ",
        nomComplet: "الاسم الكامل *",
        nomCompletSubTitle: "هذا الاسم سيظهر في التطبيق",
        email: "عنوان البريد الإلكتروني *",
        emailSubTitle: "تُستخدم لتسجيل الدخول",
      },
      passwordChange: {
        title: "تغيير كلمة المرور",
        subTitle: "قم بتحديث كلمة مرور تسجيل الدخول الخاصة بك",
        actuelPassword: "كلمة المرور الحالية *",
        newPassword: "كلمة المرور الجديدة *",
        newPasswordSub: "6 أحرف على الأقل",
        confrimPassword: "تأكيد كلمة المرور *",
        buttonTitle: "تغيير كلمة المرور",
      },
      roleAndPermissions: {
        title: "الأدوار والصلاحيات",
        subTitle: "صلاحيات الوصول الخاصة بك في التطبيق",
        notRoles: "لا توجد أدوار",
        titleBody: "الأدوار الممنوحة",
        lastUpdate: "آخر تحديث",
      },
    },
  },
  navbar: {
    authButtons: {
      login: "تسجيل الدخول",
      register: "التسجيل",
      noRoleText: "بدون دور",
      rolesTitle: "الأدوار",
      profile: "الملف الشخصي",
      logout: "تسجيل الخروج",
    },
  },
  sidebar: {
    dashboard: {
      title: "لوحة التحكم",
      description: "لوحة التحكم الرئيسية",
    },
  },
  apis: {
    common: {
      checkBody: "جسم الطلب لا يجب أن يكون فارغًا",
    },
    auth: {
      login: {
        checkExistEntrepiseName: "اسم الشركة هذا غير موجود",
        emailOrPasswordIncorrect: "البريد الإلكتروني أو كلمة المرور غير صحيحة!",
        inActiveAccount: "حسابك غير مفعل بعد، يرجى التواصل مع المدير لتفعيله.",
      },
      register: {
        checkExistEntrepiseName: "اسم المؤسسة هذا قد تم استخدامه من قبل",
        emailUsed: "هذا البريد الإلكتروني قد تم استخدامه من قبل",
      },
    },
  },
} as const;
