import * as Linking from 'expo-linking';

/**
 * Synchronise l'URL avec la navigation.
 * Sur le web, cela rend le bouton « précédent » du navigateur fonctionnel et
 * les écrans partageables — indispensable pour le back-office pro (§5).
 * Sur mobile, cela active les liens `mawsim://`.
 */
export const linking = {
  prefixes: [Linking.createURL('/'), 'https://mawsim.dz', 'mawsim://'],
  config: {
    screens: {
      // Authentification
      Onboarding: 'bienvenue',
      Phone: 'connexion',
      Otp: 'connexion/code',
      Role: 'inscription',
      ProOnboarding: 'inscription/salle',

      // Espace client
      ClientTabs: {
        path: '',
        screens: {
          Accueil: '',
          Recherche: 'recherche',
          Favoris: 'favoris',
          Resa: 'mes-reservations',
          Profil: 'profil',
        },
      },

      // Espace pro
      ProTabs: {
        path: 'pro',
        screens: {
          ProDashboard: '',
          ProPlanning: 'planning',
          ProReservations: 'reservations',
          ProSalle: 'ma-salle',
          ProMore: 'plus',
        },
      },
      ProStats: 'pro/statistiques',
      ProSubscription: 'pro/abonnement',
      ProReviews: 'pro/avis',

      // Écrans partagés
      Salle: 'salle/:id',
      Booking: 'salle/:salleId/reserver',
      ReservationDetail: 'reservation/:id',
      ReviewForm: 'reservation/:reservationId/avis',
      Notifications: 'notifications',
      Conversations: 'messages',
      Chat: 'messages/:reservationId',
    },
  },
};

export default linking;
