export default {
  // --- Commun ---
  commun: {
    enregistrer: 'Enregistrer',
    annuler: 'Annuler',
    retour: 'Retour',
    continuer: 'Continuer',
    ajouter: 'Ajouter',
    modifier: 'Modifier',
    supprimer: 'Supprimer',
    valider: 'Valider',
    refuser: 'Refuser',
    erreur: 'Erreur',
    minutes: '{{n}} min',
    devise: '{{n}} DA',
    optionnel: 'optionnel',
  },

  // --- Statuts de réservation ---
  statuts: {
    en_attente: 'En attente',
    confirme: 'Confirmé',
    termine: 'Terminé',
    annule: 'Annulé',
    no_show: 'Absence',
  },

  // --- Types de salon ---
  types: {
    tous: 'Tous',
    coiffure: 'Coiffure',
    esthetique: 'Esthétique',
    spa: 'Spa',
    barbier: 'Barbier',
    ongles: 'Ongles',
    mixte: 'Salon',
  },

  // --- Jours ---
  jours: {
    lun: 'Lundi',
    mar: 'Mardi',
    mer: 'Mercredi',
    jeu: 'Jeudi',
    ven: 'Vendredi',
    sam: 'Samedi',
    dim: 'Dimanche',
  },

  // --- Titres d'écrans ---
  ecrans: {
    disponibilites: 'Disponibilités',
    reservation: 'Réservation',
  },

  // --- Onglets ---
  onglets: {
    accueil: 'Accueil',
    recherche: 'Recherche',
    reservations: 'Réservations',
    favoris: 'Favoris',
    profil: 'Profil',
    dashboard: 'Dashboard',
    agenda: 'Agenda',
    comptoir: 'Comptoir',
    prestations: 'Prestations',
    equipe: 'Équipe',
    avis: 'Avis',
    reglages: 'Réglages',
    monAgenda: 'Mon agenda',
    moderation: 'Modération',
  },

  // --- Onboarding ---
  onboarding: {
    slide1Titre: 'Trouvez le salon parfait',
    slide1Message: 'Coiffure, esthétique, spa, barbier : tout près de chez vous.',
    slide2Titre: 'Réservez en 30 secondes',
    slide2Message: 'Choisissez la prestation, le créneau, le praticien.',
    slide3Titre: 'Fini les mauvaises surprises',
    slide3Message: 'Prix affichés, avis vérifiés, rappels automatiques.',
    suivant: 'Suivant',
    commencer: 'Commencer',
  },

  // --- Authentification ---
  auth: {
    bienvenue: 'Content de vous revoir',
    creerCompte: 'Créez votre compte',
    telephone: 'Numéro de téléphone',
    motDePasse: 'Mot de passe',
    seConnecter: 'Se connecter',
    sInscrire: "S'inscrire",
    versInscription: "Pas encore de compte ? S'inscrire",
    versConnexion: 'Déjà un compte ? Se connecter',
  },

  // --- Accueil ---
  accueil: {
    bonjour: 'Bonjour 👋',
    sousTitre: 'Trouvez votre prochain rendez-vous',
    aucunSalon: "Aucun salon pour l'instant",
    aucunSalonMessage: 'Revenez bientôt, de nouveaux salons arrivent chaque semaine.',
  },

  // --- Recherche ---
  recherche: {
    placeholder: 'Salon, quartier, ville...',
    autourDeMoi: '📍  Autour de moi',
    carte: '🗺️  Carte',
    resultatsProximite: '{{n}} salon(s) dans un rayon de 15 km',
    distance: 'à {{n}} km',
    aucunResultat: 'Aucun résultat',
    aucunResultatMessage: 'Essayez un autre quartier ou type de prestation.',
    aucunResultatProximite: 'Aucun salon géolocalisé près de vous. Essayez une recherche par quartier.',
    localisationRefusee: 'Localisation refusée',
    localisationRefuseeMessage:
      'Autorisez la localisation, ou cherchez directement par quartier — les adresses sont souvent plus parlantes qu’un rayon.',
  },

  // --- Fiche salon ---
  salon: {
    prestations: 'Prestations',
    avisClients: 'Avis clients',
    reponseSalon: 'Réponse du salon :',
    choisirCreneau: 'Choisir un créneau',
    voirSalon: 'Voir le salon',
    recapPrestations: '{{n}} prestation(s)',
    client: 'Client',
  },

  // --- Choix du praticien ---
  praticien: {
    titre: 'Avec qui ?',
    sansPreference: 'Sans préférence',
  },

  // --- Réservation ---
  reservation: {
    creneauxDisponibles: 'Créneaux disponibles',
    aucunCreneau: 'Aucun créneau disponible ce jour-là.',
    praticienResolu: 'Ce créneau sera assuré par {{nom}}.',
    confirmer: 'Confirmer le rendez-vous',
    creneauIndisponible: 'Créneau indisponible',
    creneauIndisponibleMessage: "Ce créneau vient d'être pris, merci d'en choisir un autre.",
  },

  // --- Acompte ---
  acompte: {
    demande: 'Acompte demandé',
    note: 'Cet acompte garantit votre créneau. Il est déduit du montant total à régler au salon.',
    payerCarte: 'Payer par carte (CIB / Edahabia)',
    payerEspeces: 'Payer en espèces sur place',
    indisponible: 'Paiement indisponible',
    indisponibleMessage: 'Réessayez plus tard ou payez sur place.',
    confirme: 'Paiement confirmé',
    confirmeMessage: 'Votre acompte a bien été reçu.',
    nonConfirme: 'Paiement non confirmé',
    nonConfirmeMessage: "Le paiement n'a pas abouti. Vous pouvez réessayer ou payer sur place.",
    reserveTitre: 'Réservation confirmée',
    reserveMessage: "Votre créneau est réservé. L'acompte sera à régler en espèces à votre arrivée au salon.",
  },

  // --- Mes réservations ---
  reservations: {
    aucune: 'Aucune réservation',
    aucuneMessage: 'Vos rendez-vous à venir apparaîtront ici.',
    avec: 'avec {{nom}}',
    acompteStatut: 'Acompte {{montant}} DA — {{statut}}',
    acomptePaye: 'payé',
    acompteNonRegle: 'non réglé',
    annuler: 'Annuler le rendez-vous',
    laisserAvis: 'Laisser un avis',
    avisDepose: 'Avis déposé ✓',
  },

  // --- Annulation ---
  annulation: {
    confirmerTitre: 'Annuler ce rendez-vous ?',
    confirmerAvecAcompte:
      "Selon le délai d'annulation du salon, votre acompte de {{montant}} DA peut ne pas être remboursé.",
    confirmerSansAcompte: 'Cette action est définitive.',
    confirmerAction: 'Annuler le RDV',
    impossible: 'Annulation impossible',
    reessayer: 'Réessayez plus tard.',
    annulee: 'Réservation annulée',
    remboursementEspeces: 'Votre acompte vous sera restitué directement par le salon.',
    remboursementCarte: 'Votre acompte a été remboursé sur votre carte.',
    remboursementEnAttente: 'Annulé, remboursement en attente',
    remboursementEnAttenteMessage:
      "Votre réservation est annulée. Le remboursement n'a pas pu être traité automatiquement, le salon vous recontactera.",
  },

  // --- Avis ---
  avis: {
    titre: 'Votre avis sur {{salon}}',
    placeholder: 'Partagez votre expérience (optionnel)',
    publier: 'Publier mon avis',
    noteRequise: 'Note requise',
    noteRequiseMessage: 'Attribuez une note de 1 à 5 étoiles.',
    merci: 'Merci !',
    merciMessage: 'Votre avis a bien été publié.',
    aucun: "Aucun avis pour l'instant",
    aucunMessage: 'Les avis apparaîtront après les premiers rendez-vous honorés.',
    votreReponse: 'Votre réponse',
    repondrePlaceholder: 'Répondre publiquement…',
    publierReponse: 'Publier la réponse',
  },

  // --- Favoris ---
  favoris: {
    aucun: 'Aucun favori',
    aucunMessage: 'Ajoutez des salons à vos favoris pour les retrouver ici.',
  },

  // --- Notifications ---
  notifications: {
    titre: 'Notifications',
    aucune: 'Aucune notification',
  },

  // --- Profil ---
  profil: {
    scoreFiabilite: 'Score de fiabilité',
    changerSalon: 'Changer de salon',
    langue: 'Langue',
    seDeconnecter: 'Se déconnecter',
    langueChangee: 'Langue modifiée',
    redemarrageRequis:
      "L'application doit redémarrer pour appliquer le sens de lecture. Fermez puis rouvrez Salony.",
  },

  // --- Dashboard pro ---
  dashboard: {
    titre: 'Tableau de bord',
    rdvAujourdhui: "RDV aujourd'hui",
    caSemaine: 'CA cette semaine',
    tauxAbsence: "Taux d'absence",
  },

  // --- Agenda / Comptoir ---
  agenda: {
    aucunRdv: 'Aucun rendez-vous ce jour-là',
    aujourdhui: "Aujourd'hui",
    aucunEnAttente: 'Aucun rendez-vous en attente',
    termine: 'Terminé',
    absence: 'Absence',
    acompteRecu: 'Marquer acompte reçu',
    acompteLigne: 'Acompte {{montant}} DA — {{statut}}',
    acompteRecuStatut: 'reçu ✓',
    acompteAttente: 'en attente',
    compteNonRattache: 'Compte non rattaché',
    compteNonRattacheMessage:
      "Votre compte n'est lié à aucune fiche praticien. Demandez au gérant de votre salon de vous rattacher depuis l'onglet Équipe.",
  },

  // --- Prestations (pro) ---
  prestations: {
    titre: 'Prestations',
    aucune: 'Aucune prestation',
    aucuneMessage: 'Ajoutez vos coupes, colorations, soins...',
    nouvelle: 'Nouvelle prestation',
    nom: 'Nom (ex: Coupe femme)',
    duree: 'Durée (min)',
    prix: 'Prix (DA)',
  },

  // --- Équipe (pro) ---
  equipe: {
    titre: 'Équipe',
    aucun: 'Aucun praticien',
    aucunMessage: 'Ajoutez les membres de votre équipe pour gérer leurs disponibilités.',
    aucuneSpecialite: 'Aucune spécialité renseignée',
    compteRattache: 'Compte employé rattaché',
    horaires: 'Horaires',
    nomPraticien: 'Nom',
    nomPlaceholder: 'Ex : Amina B.',
    specialites: 'Spécialités',
    specialitesPlaceholder: 'Coloration, Brushing, Soin visage',
    specialitesAide: 'Séparées par des virgules.',
    ajouterPhoto: 'Ajouter une photo',
    changerPhoto: 'Changer la photo',
    ajouterPraticien: 'Ajouter le praticien',
    nomRequis: 'Nom requis',
    nomRequisMessage: 'Renseignez au moins le nom du praticien.',
    prestationsAssurees: 'Prestations assurées',
    prestationsAide:
      "Si aucune n'est cochée, ce praticien est considéré comme polyvalent et peut être proposé pour toutes les prestations.",
    aucuneAuCatalogue: "Aucune prestation au catalogue pour l'instant.",
    compteEmploye: 'Compte employé',
    compteDejaLie: "Un compte est déjà rattaché : ce praticien voit son propre agenda dans l'application.",
    compteALier:
      "Rattachez le compte de votre employé pour qu'il consulte son agenda. Il doit d'abord s'être inscrit avec ce numéro.",
    telephoneEmploye: "Téléphone de l'employé",
    rattacherCompte: 'Rattacher le compte',
    compteRattacheOk: 'Compte rattaché',
    rattachementImpossible: 'Rattachement impossible',
    retirer: "Retirer de l'équipe",
    retirerTitre: 'Retirer ce praticien ?',
    retirerMessage: "Il n'apparaîtra plus à la réservation. Ses rendez-vous passés sont conservés.",
  },

  // --- Disponibilités ---
  disponibilites: {
    titre: 'Disponibilités — {{nom}}',
    horairesHabituels: 'Horaires habituels',
    enregistrerHoraires: 'Enregistrer les horaires',
    horaireInvalide: 'Horaire invalide',
    horaireInvalideMessage: 'Vérifiez les heures pour {{jour}} (format HH:MM, fin après début).',
    enregistre: 'Enregistré',
    horairesMisAJour: 'Les horaires habituels ont été mis à jour.',
    conges: 'Congés / jours fermés',
    datePlaceholder: 'Date (AAAA-MM-JJ)',
    motifPlaceholder: 'Motif (optionnel)',
    ajouterJourFerme: 'Ajouter un jour fermé',
    dateInvalide: 'Date invalide',
    dateInvalideMessage: 'Format attendu : AAAA-MM-JJ',
  },

  // --- Réglages salon ---
  reglages: {
    titre: 'Paramètres du salon',
    informations: 'Informations',
    nomSalon: 'Nom du salon',
    description: 'Description',
    telephone: 'Téléphone',
    whatsapp: 'WhatsApp',
    adresse: 'Adresse',
    quartier: 'Quartier',
    ville: 'Ville',
    wilaya: 'Wilaya',
    position: 'Position sur la carte',
    positionOk: 'Votre salon est géolocalisé et visible sur la carte des clients.',
    positionAbsente: "Sans position, votre salon n'apparaît pas sur la carte.",
    modifierPosition: 'Modifier la position',
    placerCarte: 'Placer sur la carte',
    politiqueAnnulation: "Politique d'annulation",
    delaiAide:
      "Nombre d'heures avant le rendez-vous en deçà desquelles l'acompte n'est plus remboursable.",
    delaiInvalide: 'Délai invalide',
    delaiInvalideMessage: "Le délai d'annulation doit être un nombre entier d'heures (0 ou plus).",
    horairesOuverture: "Horaires d'ouverture",
    horairesAide:
      'Ces horaires sont affichés aux clients. Les créneaux réservables dépendent, eux, des disponibilités de chaque praticien (onglet Équipe).',
    photos: 'Photos',
    photosAide: 'Appui long sur une photo pour la retirer.',
    ajouterPhoto: 'Ajouter une photo',
    enregistre: 'Enregistré',
    enregistreMessage: 'Les paramètres du salon ont été mis à jour.',
    permissionRefusee: 'Permission refusée',
    permissionPhotos: "L'accès à vos photos est nécessaire pour illustrer le salon.",
    echecUpload: 'Échec',
    echecUploadMessage: "La photo n'a pas pu être envoyée.",
  },

  // --- Position ---
  position: {
    aideAvecPoint: 'Déplacez le repère pour ajuster, puis enregistrez.',
    aideSansPoint: 'Touchez la carte à l’emplacement exact de votre salon.',
    enregistrerPosition: 'Enregistrer la position',
    aucunPoint: 'Aucun point',
    aucunPointMessage: 'Touchez la carte pour placer votre salon.',
    enregistree: 'Position enregistrée',
    enregistreeMessage: 'Votre salon apparaît maintenant sur la carte des clients.',
  },

  // --- Inscription salon ---
  inscription: {
    titre: 'Inscrivez votre salon',
    sousTitre: 'Ces informations seront vérifiées avant publication.',
    registreCommerce: 'Registre de commerce (optionnel)',
    envoyer: 'Envoyer la demande',
    champsManquants: 'Champs manquants',
    champsManquantsMessage:
      'Merci de renseigner au minimum le nom, téléphone, adresse et ville.',
    envoyee: 'Demande envoyée',
    envoyeeMessage: 'Votre salon sera visible dès validation par notre équipe.',
    autreSalon: '+ Inscrire un autre salon',
    vosSalons: 'Vos salons',
  },

  // --- Statuts salon ---
  statutsSalon: {
    en_attente: 'En validation',
    valide: 'Actif',
    suspendu: 'Suspendu',
    rejete: 'Refusé',
  },

  // --- Modération ---
  moderation: {
    titre: 'Modération',
    aValider: 'À valider',
    actifs: 'Actifs',
    suspendus: 'Suspendus',
    refuses: 'Refusés',
    rienATraiter: 'Rien à traiter ici',
    registre: 'Registre de commerce : {{valeur}}',
    nonFourni: 'non fourni',
    demandeDe: 'Demande de {{nom}}',
    tel: 'Tél : {{numero}}',
    suspendre: 'Suspendre',
    refuserTitre: 'Refuser ce salon ?',
    refuserMessage: '{{nom}} ne sera pas publié. Le propriétaire sera notifié.',
    actionRefusee: 'Action refusée',
  },
};
