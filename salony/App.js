import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from './supabase';
import { colors } from './src/theme';

import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import SalonScreen from './screens/SalonScreen';
import StaffSelectScreen from './screens/StaffSelectScreen';
import BookingFormScreen from './screens/BookingFormScreen';
import AcompteScreen from './screens/AcompteScreen';
import MapScreen from './screens/MapScreen';
import ReservationsScreen from './screens/ReservationsScreen';
import FavorisScreen from './screens/FavorisScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfilScreen from './screens/ProfilScreen';
import ProDashboard from './screens/ProDashboard';
import ProAgenda from './screens/ProAgenda';
import ProComptoir from './screens/ProComptoir';
import ProServicesScreen from './screens/ProServicesScreen';
import ProStaffScreen from './screens/ProStaffScreen';
import ProStaffFormScreen from './screens/ProStaffFormScreen';
import ProAvailabilityScreen from './screens/ProAvailabilityScreen';
import ProSettingsScreen from './screens/ProSettingsScreen';
import ProLocationScreen from './screens/ProLocationScreen';
import ReviewFormScreen from './screens/ReviewFormScreen';
import ProReviewsScreen from './screens/ProReviewsScreen';
import StaffAgendaScreen from './screens/StaffAgendaScreen';
import AdminScreen from './screens/AdminScreen';
import ProSalonSelectScreen from './screens/ProSalonSelectScreen';
import ProInscriptionScreen from './screens/ProInscriptionScreen';
import { SalonProvider } from './src/SalonContext';
import { I18nProvider, useT } from './src/i18n';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation client : Accueil, Recherche, Réservations, Favoris, Profil
function ClientTabs() {
  const t = useT();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('onglets.accueil') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('onglets.recherche') }} />
      <Tab.Screen name="Reservations" component={ReservationsScreen} options={{ title: t('onglets.reservations') }} />
      <Tab.Screen name="Favoris" component={FavorisScreen} options={{ title: t('onglets.favoris') }} />
      <Tab.Screen name="Profil" component={ProfilScreen} options={{ title: t('onglets.profil') }} />
    </Tab.Navigator>
  );
}

// Navigation pro : Dashboard, Agenda, Comptoir, Services, Équipe, Profil
function ProTabs({ route }) {
  const t = useT();
  const { salonId } = route.params;
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="ProDashboard" component={ProDashboard} initialParams={{ salonId }} options={{ title: t('onglets.dashboard') }} />
      <Tab.Screen name="ProAgenda" component={ProAgenda} initialParams={{ salonId }} options={{ title: t('onglets.agenda') }} />
      <Tab.Screen name="ProComptoir" component={ProComptoir} initialParams={{ salonId }} options={{ title: t('onglets.comptoir') }} />
      <Tab.Screen name="ProServices" component={ProServicesScreen} initialParams={{ salonId }} options={{ title: t('onglets.prestations') }} />
      <Tab.Screen name="ProStaff" component={ProStaffScreen} initialParams={{ salonId }} options={{ title: t('onglets.equipe') }} />
      <Tab.Screen name="ProReviews" component={ProReviewsScreen} initialParams={{ salonId }} options={{ title: t('onglets.avis') }} />
      <Tab.Screen name="ProSettings" component={ProSettingsScreen} initialParams={{ salonId }} options={{ title: t('onglets.reglages') }} />
      <Tab.Screen name="ProProfil" component={ProfilScreen} options={{ title: t('onglets.profil') }} />
    </Tab.Navigator>
  );
}

// Navigation administrateur : modération des salons
function AdminTabs() {
  const t = useT();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="AdminModeration" component={AdminScreen} options={{ title: t('onglets.moderation') }} />
      <Tab.Screen name="AdminProfil" component={ProfilScreen} options={{ title: t('onglets.profil') }} />
    </Tab.Navigator>
  );
}

// Navigation employé : son propre agenda uniquement (les RLS l'y contraignent)
function StaffTabs() {
  const t = useT();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="StaffAgenda" component={StaffAgendaScreen} options={{ title: t('onglets.monAgenda') }} />
      <Tab.Screen name="StaffProfil" component={ProfilScreen} options={{ title: t('onglets.profil') }} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const t = useT();
  const [session, setSession] = useState(undefined); // undefined = chargement
  const [profil, setProfil] = useState(null);
  const [salons, setSalons] = useState([]);
  const [salonId, setSalonId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfil(null); setSalons([]); setSalonId(null); return; }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfil(data));
  }, [session]);

  // Un compte pro peut détenir plusieurs salons : on les charge tous et on
  // sélectionne automatiquement s'il n'y en a qu'un seul d'actif.
  const chargerSalons = useCallback(async () => {
    if (profil?.role !== 'pro') { setSalons([]); setSalonId(null); return; }
    const { data } = await supabase
      .from('salons')
      .select('id, nom, statut')
      .eq('owner_id', profil.id)
      .order('created_at');

    const liste = data ?? [];
    setSalons(liste);
    // sélection automatique uniquement s'il n'y a qu'un seul salon actif
    setSalonId((actuel) => {
      if (actuel && liste.some((s) => s.id === actuel)) return actuel;
      const actifs = liste.filter((s) => s.statut === 'valide');
      return actifs.length === 1 ? actifs[0].id : null;
    });
  }, [profil]);

  useEffect(() => { chargerSalons(); }, [chargerSalons]);

  if (session === undefined) return null; // splash / loading

  return (
    <SalonProvider value={{ salonId, salons, choisirSalon: setSalonId, rechargerSalons: chargerSalons }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : profil?.role === 'admin' ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : profil?.role === 'staff' ? (
          <Stack.Screen name="StaffTabs" component={StaffTabs} />
        ) : profil?.role === 'pro' ? (
          salonId ? (
            <>
              {/* key : force le remontage des onglets au changement de salon,
                  initialParams étant figé après le premier rendu */}
              <Stack.Screen key={salonId} name="ProTabs" component={ProTabs} initialParams={{ salonId }} />
              <Stack.Screen name="ProStaffForm" component={ProStaffFormScreen} options={{ headerShown: true, title: t('praticien.titre') }} />
              <Stack.Screen name="ProAvailability" component={ProAvailabilityScreen} options={{ headerShown: true, title: t('ecrans.disponibilites') }} />
              <Stack.Screen name="ProLocation" component={ProLocationScreen} options={{ headerShown: true, title: t('reglages.position') }} />
              <Stack.Screen name="ProSalonSelect" component={ProSalonSelectScreen} options={{ headerShown: true, title: t('profil.changerSalon') }} />
              <Stack.Screen name="ProInscription" component={ProInscriptionScreen} options={{ headerShown: true, title: t('inscription.titre') }} />
            </>
          ) : salons.length > 0 ? (
            // plusieurs salons (ou aucun encore validé) : on demande de choisir
            <>
              <Stack.Screen name="ProSalonSelect" component={ProSalonSelectScreen} options={{ headerShown: true, title: t('inscription.vosSalons') }} />
              <Stack.Screen name="ProInscription" component={ProInscriptionScreen} options={{ headerShown: true, title: t('inscription.titre') }} />
            </>
          ) : (
            <Stack.Screen name="ProInscription" component={ProInscriptionScreen} options={{ headerShown: true, title: t('inscription.titre') }} />
          )
        ) : (
          <>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="Salon" component={SalonScreen} options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="StaffSelect" component={StaffSelectScreen} options={{ headerShown: true, title: t('praticien.titre') }} />
            <Stack.Screen name="BookingForm" component={BookingFormScreen} options={{ headerShown: true, title: t('ecrans.reservation') }} />
            <Stack.Screen name="Acompte" component={AcompteScreen} options={{ headerShown: true, title: t('acompte.demande') }} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="ReviewForm" component={ReviewFormScreen} options={{ headerShown: true, title: t('reservations.laisserAvis') }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: t('notifications.titre') }} />
            <Stack.Screen name="ProInscription" component={ProInscriptionScreen} options={{ headerShown: true, title: t('inscription.titre') }} />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
    </SalonProvider>
  );
}

// Le provider i18n enveloppe toute la navigation : les titres d'onglets et
// d'écrans sont résolus au rendu, donc ils suivent le changement de langue.
export default function App() {
  return (
    <I18nProvider>
      <Navigation />
    </I18nProvider>
  );
}
