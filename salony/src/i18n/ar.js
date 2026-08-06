export default {
  // --- Commun ---
  commun: {
    enregistrer: 'حفظ',
    annuler: 'إلغاء',
    retour: 'رجوع',
    continuer: 'متابعة',
    ajouter: 'إضافة',
    modifier: 'تعديل',
    supprimer: 'حذف',
    valider: 'قبول',
    refuser: 'رفض',
    erreur: 'خطأ',
    minutes: '{{n}} دقيقة',
    devise: '{{n}} دج',
    optionnel: 'اختياري',
  },

  // --- Statuts de réservation ---
  statuts: {
    en_attente: 'في الانتظار',
    confirme: 'مؤكَّد',
    termine: 'منتهٍ',
    annule: 'ملغى',
    no_show: 'عدم حضور',
  },

  // --- Types de salon ---
  types: {
    tous: 'الكل',
    coiffure: 'حلاقة',
    esthetique: 'تجميل',
    spa: 'منتجع صحي',
    barbier: 'حلاق رجال',
    ongles: 'أظافر',
    mixte: 'صالون',
  },

  // --- Jours ---
  jours: {
    lun: 'الإثنين',
    mar: 'الثلاثاء',
    mer: 'الأربعاء',
    jeu: 'الخميس',
    ven: 'الجمعة',
    sam: 'السبت',
    dim: 'الأحد',
  },

  // --- Titres d'écrans ---
  ecrans: {
    disponibilites: 'أوقات العمل',
    reservation: 'الحجز',
  },

  // --- Onglets ---
  onglets: {
    accueil: 'الرئيسية',
    recherche: 'بحث',
    reservations: 'حجوزاتي',
    favoris: 'المفضلة',
    profil: 'حسابي',
    dashboard: 'لوحة التحكم',
    agenda: 'الأجندة',
    comptoir: 'الاستقبال',
    prestations: 'الخدمات',
    equipe: 'الفريق',
    avis: 'التقييمات',
    reglages: 'الإعدادات',
    monAgenda: 'أجندتي',
    moderation: 'المراجعة',
  },

  // --- Onboarding ---
  onboarding: {
    slide1Titre: 'اعثر على الصالون المناسب',
    slide1Message: 'حلاقة، تجميل، منتجع صحي، حلاق رجال: قريبًا منك.',
    slide2Titre: 'احجز في 30 ثانية',
    slide2Message: 'اختر الخدمة والموعد والمختص.',
    slide3Titre: 'لا مفاجآت بعد اليوم',
    slide3Message: 'أسعار معلنة، تقييمات موثوقة، تذكيرات تلقائية.',
    suivant: 'التالي',
    commencer: 'ابدأ',
  },

  // --- Authentification ---
  auth: {
    bienvenue: 'سعداء بعودتك',
    creerCompte: 'أنشئ حسابك',
    telephone: 'رقم الهاتف',
    motDePasse: 'كلمة المرور',
    seConnecter: 'تسجيل الدخول',
    sInscrire: 'إنشاء حساب',
    versInscription: 'ليس لديك حساب؟ أنشئ حسابًا',
    versConnexion: 'لديك حساب؟ سجّل الدخول',
  },

  // --- Accueil ---
  accueil: {
    bonjour: 'مرحبًا 👋',
    sousTitre: 'اعثر على موعدك القادم',
    aucunSalon: 'لا توجد صالونات حاليًا',
    aucunSalonMessage: 'عد قريبًا، تُضاف صالونات جديدة كل أسبوع.',
  },

  // --- Recherche ---
  recherche: {
    placeholder: 'صالون، حي، مدينة...',
    autourDeMoi: '📍  بالقرب مني',
    carte: '🗺️  الخريطة',
    resultatsProximite: '{{n}} صالون في دائرة 15 كلم',
    distance: 'على بعد {{n}} كلم',
    aucunResultat: 'لا توجد نتائج',
    aucunResultatMessage: 'جرّب حيًا آخر أو نوع خدمة مختلفًا.',
    aucunResultatProximite: 'لا يوجد صالون محدَّد الموقع بالقرب منك. جرّب البحث بالحي.',
    localisationRefusee: 'تم رفض تحديد الموقع',
    localisationRefuseeMessage:
      'اسمح بتحديد الموقع، أو ابحث مباشرة بالحي — فالعناوين غالبًا أوضح من دائرة البحث.',
  },

  // --- Fiche salon ---
  salon: {
    prestations: 'الخدمات',
    avisClients: 'آراء الزبائن',
    reponseSalon: 'رد الصالون:',
    choisirCreneau: 'اختيار موعد',
    voirSalon: 'عرض الصالون',
    recapPrestations: '{{n}} خدمة',
    client: 'زبون',
  },

  // --- Choix du praticien ---
  praticien: {
    titre: 'مع من؟',
    sansPreference: 'بدون تفضيل',
  },

  // --- Réservation ---
  reservation: {
    creneauxDisponibles: 'المواعيد المتاحة',
    aucunCreneau: 'لا يوجد موعد متاح في هذا اليوم.',
    praticienResolu: 'سيتولى هذا الموعد {{nom}}.',
    confirmer: 'تأكيد الموعد',
    creneauIndisponible: 'الموعد غير متاح',
    creneauIndisponibleMessage: 'تم حجز هذا الموعد للتو، يرجى اختيار موعد آخر.',
  },

  // --- Acompte ---
  acompte: {
    demande: 'العربون المطلوب',
    note: 'يضمن هذا العربون موعدك، ويُخصم من المبلغ الإجمالي عند الدفع في الصالون.',
    payerCarte: 'الدفع بالبطاقة (CIB / الذهبية)',
    payerEspeces: 'الدفع نقدًا في الصالون',
    indisponible: 'الدفع غير متاح',
    indisponibleMessage: 'أعد المحاولة لاحقًا أو ادفع في الصالون.',
    confirme: 'تم تأكيد الدفع',
    confirmeMessage: 'تم استلام عربونك بنجاح.',
    nonConfirme: 'لم يتم تأكيد الدفع',
    nonConfirmeMessage: 'لم تكتمل عملية الدفع. يمكنك إعادة المحاولة أو الدفع في الصالون.',
    reserveTitre: 'تم تأكيد الحجز',
    reserveMessage: 'موعدك محجوز. يُدفع العربون نقدًا عند وصولك إلى الصالون.',
  },

  // --- Mes réservations ---
  reservations: {
    aucune: 'لا توجد حجوزات',
    aucuneMessage: 'ستظهر مواعيدك القادمة هنا.',
    avec: 'مع {{nom}}',
    acompteStatut: 'العربون {{montant}} دج — {{statut}}',
    acomptePaye: 'مدفوع',
    acompteNonRegle: 'غير مدفوع',
    annuler: 'إلغاء الموعد',
    laisserAvis: 'اترك تقييمًا',
    avisDepose: 'تم إرسال التقييم ✓',
  },

  // --- Annulation ---
  annulation: {
    confirmerTitre: 'إلغاء هذا الموعد؟',
    confirmerAvecAcompte:
      'حسب مهلة الإلغاء المحددة من الصالون، قد لا يُسترجع عربونك البالغ {{montant}} دج.',
    confirmerSansAcompte: 'هذا الإجراء نهائي.',
    confirmerAction: 'إلغاء الموعد',
    impossible: 'تعذّر الإلغاء',
    reessayer: 'أعد المحاولة لاحقًا.',
    annulee: 'تم إلغاء الحجز',
    remboursementEspeces: 'سيُعيد لك الصالون العربون مباشرة.',
    remboursementCarte: 'تم استرجاع عربونك إلى بطاقتك.',
    remboursementEnAttente: 'تم الإلغاء، الاسترجاع قيد المعالجة',
    remboursementEnAttenteMessage:
      'تم إلغاء حجزك. تعذّرت معالجة الاسترجاع تلقائيًا، وسيتواصل معك الصالون.',
  },

  // --- Avis ---
  avis: {
    titre: 'رأيك في {{salon}}',
    placeholder: 'شاركنا تجربتك (اختياري)',
    publier: 'نشر التقييم',
    noteRequise: 'التقييم مطلوب',
    noteRequiseMessage: 'امنح تقييمًا من 1 إلى 5 نجوم.',
    merci: 'شكرًا!',
    merciMessage: 'تم نشر تقييمك بنجاح.',
    aucun: 'لا توجد تقييمات حاليًا',
    aucunMessage: 'ستظهر التقييمات بعد أول المواعيد المنجزة.',
    votreReponse: 'ردّك',
    repondrePlaceholder: 'الرد علنًا…',
    publierReponse: 'نشر الرد',
  },

  // --- Favoris ---
  favoris: {
    aucun: 'لا توجد مفضلات',
    aucunMessage: 'أضف صالونات إلى مفضلتك لتجدها هنا.',
  },

  // --- Notifications ---
  notifications: {
    titre: 'الإشعارات',
    aucune: 'لا توجد إشعارات',
  },

  // --- Profil ---
  profil: {
    scoreFiabilite: 'درجة الموثوقية',
    changerSalon: 'تغيير الصالون',
    langue: 'اللغة',
    seDeconnecter: 'تسجيل الخروج',
    langueChangee: 'تم تغيير اللغة',
    redemarrageRequis:
      'يجب إعادة تشغيل التطبيق لتطبيق اتجاه الكتابة. أغلق سالوني ثم أعد فتحه.',
  },

  // --- Dashboard pro ---
  dashboard: {
    titre: 'لوحة التحكم',
    rdvAujourdhui: 'مواعيد اليوم',
    caSemaine: 'مداخيل الأسبوع',
    tauxAbsence: 'نسبة عدم الحضور',
  },

  // --- Agenda / Comptoir ---
  agenda: {
    aucunRdv: 'لا توجد مواعيد في هذا اليوم',
    aujourdhui: 'اليوم',
    aucunEnAttente: 'لا توجد مواعيد قيد الانتظار',
    termine: 'منتهٍ',
    absence: 'عدم حضور',
    acompteRecu: 'تأكيد استلام العربون',
    acompteLigne: 'العربون {{montant}} دج — {{statut}}',
    acompteRecuStatut: 'مستلَم ✓',
    acompteAttente: 'في الانتظار',
    compteNonRattache: 'حساب غير مرتبط',
    compteNonRattacheMessage:
      'حسابك غير مرتبط بأي بطاقة مختص. اطلب من مسؤول الصالون ربطه من تبويب الفريق.',
  },

  // --- Prestations (pro) ---
  prestations: {
    titre: 'الخدمات',
    aucune: 'لا توجد خدمات',
    aucuneMessage: 'أضف قصات الشعر، الصباغة، العناية...',
    nouvelle: 'خدمة جديدة',
    nom: 'الاسم (مثال: قص شعر نساء)',
    duree: 'المدة (بالدقائق)',
    prix: 'السعر (دج)',
  },

  // --- Équipe (pro) ---
  equipe: {
    titre: 'الفريق',
    aucun: 'لا يوجد مختصون',
    aucunMessage: 'أضف أعضاء فريقك لإدارة أوقات عملهم.',
    aucuneSpecialite: 'لم تُحدَّد أي تخصصات',
    compteRattache: 'حساب الموظف مرتبط',
    horaires: 'أوقات العمل',
    nomPraticien: 'الاسم',
    nomPlaceholder: 'مثال: أمينة ب.',
    specialites: 'التخصصات',
    specialitesPlaceholder: 'صباغة، تصفيف، عناية بالبشرة',
    specialitesAide: 'افصل بينها بفواصل.',
    ajouterPhoto: 'إضافة صورة',
    changerPhoto: 'تغيير الصورة',
    ajouterPraticien: 'إضافة المختص',
    nomRequis: 'الاسم مطلوب',
    nomRequisMessage: 'أدخل اسم المختص على الأقل.',
    prestationsAssurees: 'الخدمات المقدَّمة',
    prestationsAide:
      'إذا لم تُحدَّد أي خدمة، يُعتبر هذا المختص متعدد المهام ويمكن اقتراحه لجميع الخدمات.',
    aucuneAuCatalogue: 'لا توجد خدمات في القائمة حاليًا.',
    compteEmploye: 'حساب الموظف',
    compteDejaLie: 'الحساب مرتبط بالفعل: يمكن لهذا المختص الاطلاع على أجندته في التطبيق.',
    compteALier:
      'اربط حساب موظفك ليطّلع على أجندته. يجب أن يكون قد أنشأ حسابًا بهذا الرقم أولًا.',
    telephoneEmploye: 'هاتف الموظف',
    rattacherCompte: 'ربط الحساب',
    compteRattacheOk: 'تم ربط الحساب',
    rattachementImpossible: 'تعذّر الربط',
    retirer: 'إزالة من الفريق',
    retirerTitre: 'إزالة هذا المختص؟',
    retirerMessage: 'لن يظهر بعد الآن عند الحجز. تبقى مواعيده السابقة محفوظة.',
  },

  // --- Disponibilités ---
  disponibilites: {
    titre: 'أوقات العمل — {{nom}}',
    horairesHabituels: 'أوقات العمل المعتادة',
    enregistrerHoraires: 'حفظ أوقات العمل',
    horaireInvalide: 'توقيت غير صالح',
    horaireInvalideMessage: 'تحقق من توقيت {{jour}} (بصيغة HH:MM، والنهاية بعد البداية).',
    enregistre: 'تم الحفظ',
    horairesMisAJour: 'تم تحديث أوقات العمل المعتادة.',
    conges: 'العطل / أيام الغلق',
    datePlaceholder: 'التاريخ (سنة-شهر-يوم)',
    motifPlaceholder: 'السبب (اختياري)',
    ajouterJourFerme: 'إضافة يوم غلق',
    dateInvalide: 'تاريخ غير صالح',
    dateInvalideMessage: 'الصيغة المطلوبة: سنة-شهر-يوم',
  },

  // --- Réglages salon ---
  reglages: {
    titre: 'إعدادات الصالون',
    informations: 'المعلومات',
    nomSalon: 'اسم الصالون',
    description: 'الوصف',
    telephone: 'الهاتف',
    whatsapp: 'واتساب',
    adresse: 'العنوان',
    quartier: 'الحي',
    ville: 'المدينة',
    wilaya: 'الولاية',
    position: 'الموقع على الخريطة',
    positionOk: 'صالونك محدَّد الموقع وظاهر على خريطة الزبائن.',
    positionAbsente: 'بدون تحديد الموقع، لن يظهر صالونك على الخريطة.',
    modifierPosition: 'تعديل الموقع',
    placerCarte: 'تحديد على الخريطة',
    politiqueAnnulation: 'سياسة الإلغاء',
    delaiAide: 'عدد الساعات قبل الموعد التي لا يُسترجع العربون بعدها.',
    delaiInvalide: 'مهلة غير صالحة',
    delaiInvalideMessage: 'يجب أن تكون مهلة الإلغاء عددًا صحيحًا من الساعات (0 أو أكثر).',
    horairesOuverture: 'أوقات الفتح',
    horairesAide:
      'تُعرض هذه الأوقات على الزبائن. أما المواعيد القابلة للحجز فتعتمد على أوقات عمل كل مختص (تبويب الفريق).',
    photos: 'الصور',
    photosAide: 'اضغط مطولًا على صورة لإزالتها.',
    ajouterPhoto: 'إضافة صورة',
    enregistre: 'تم الحفظ',
    enregistreMessage: 'تم تحديث إعدادات الصالون.',
    permissionRefusee: 'تم رفض الإذن',
    permissionPhotos: 'الوصول إلى صورك ضروري لعرض الصالون.',
    echecUpload: 'فشل',
    echecUploadMessage: 'تعذّر إرسال الصورة.',
  },

  // --- Position ---
  position: {
    aideAvecPoint: 'حرّك العلامة للضبط، ثم احفظ.',
    aideSansPoint: 'اضغط على الخريطة في الموقع الدقيق لصالونك.',
    enregistrerPosition: 'حفظ الموقع',
    aucunPoint: 'لم يُحدَّد موقع',
    aucunPointMessage: 'اضغط على الخريطة لتحديد موقع صالونك.',
    enregistree: 'تم حفظ الموقع',
    enregistreeMessage: 'أصبح صالونك ظاهرًا الآن على خريطة الزبائن.',
  },

  // --- Inscription salon ---
  inscription: {
    titre: 'سجّل صالونك',
    sousTitre: 'سيتم التحقق من هذه المعلومات قبل النشر.',
    registreCommerce: 'السجل التجاري (اختياري)',
    envoyer: 'إرسال الطلب',
    champsManquants: 'حقول ناقصة',
    champsManquantsMessage: 'يرجى إدخال الاسم والهاتف والعنوان والمدينة على الأقل.',
    envoyee: 'تم إرسال الطلب',
    envoyeeMessage: 'سيظهر صالونك بمجرد مصادقة فريقنا عليه.',
    autreSalon: '+ تسجيل صالون آخر',
    vosSalons: 'صالوناتك',
  },

  // --- Statuts salon ---
  statutsSalon: {
    en_attente: 'قيد المصادقة',
    valide: 'نشط',
    suspendu: 'موقوف',
    rejete: 'مرفوض',
  },

  // --- Modération ---
  moderation: {
    titre: 'المراجعة',
    aValider: 'قيد المصادقة',
    actifs: 'نشطة',
    suspendus: 'موقوفة',
    refuses: 'مرفوضة',
    rienATraiter: 'لا شيء للمعالجة هنا',
    registre: 'السجل التجاري: {{valeur}}',
    nonFourni: 'غير مقدَّم',
    demandeDe: 'طلب من {{nom}}',
    tel: 'الهاتف: {{numero}}',
    suspendre: 'إيقاف',
    refuserTitre: 'رفض هذا الصالون؟',
    refuserMessage: 'لن يُنشر {{nom}}. سيتم إشعار المالك.',
    actionRefusee: 'تم رفض الإجراء',
  },
};
