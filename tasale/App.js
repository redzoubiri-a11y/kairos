import { View, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { I18nProvider, useI18n } from './src/i18n';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { linking } from './src/linking';
import { configureForegroundBehaviour } from './src/services/push';
import { ROLES } from './src/lib/constants';

// Comportement des notifications reçues app ouverte — à déclarer une seule
// fois, avant tout rendu.
configureForegroundBehaviour();

// Authentification
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import PhoneScreen from './src/screens/auth/PhoneScreen';
import OtpScreen from './src/screens/auth/OtpScreen';
import RoleScreen from './src/screens/auth/RoleScreen';
import ProOnboardingScreen from './src/screens/auth/ProOnboardingScreen';

// Client
import HomeScreen from './src/screens/client/HomeScreen';
import SearchScreen from './src/screens/client/SearchScreen';
import SalleScreen from './src/screens/client/SalleScreen';
import BookingScreen from './src/screens/client/BookingScreen';
import MyReservationsScreen from './src/screens/client/MyReservationsScreen';
import ReservationDetailScreen from './src/screens/client/ReservationDetailScreen';
import FavoritesScreen from './src/screens/client/FavoritesScreen';
import ReviewFormScreen from './src/screens/client/ReviewFormScreen';

// Pro
import ProDashboardScreen from './src/screens/pro/ProDashboardScreen';
import ProPlanningScreen from './src/screens/pro/ProPlanningScreen';
import ProReservationsScreen from './src/screens/pro/ProReservationsScreen';
import ProSalleScreen from './src/screens/pro/ProSalleScreen';
import ProStatsScreen from './src/screens/pro/ProStatsScreen';
import ProSubscriptionScreen from './src/screens/pro/ProSubscriptionScreen';
import ProReviewsScreen from './src/screens/pro/ProReviewsScreen';
import ProMoreScreen from './src/screens/pro/ProMoreScreen';

// Partagés
import NotificationsScreen from './src/screens/shared/NotificationsScreen';
import ConversationsScreen from './src/screens/shared/ConversationsScreen';
import ChatScreen from './src/screens/shared/ChatScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CLIENT_TAB_ICONS = {
  Accueil: 'home',
  Recherche: 'search',
  Favoris: 'heart',
  Resa: 'calendar',
  Profil: 'person',
};

const PRO_TAB_ICONS = {
  ProDashboard: 'grid',
  ProPlanning: 'calendar',
  ProReservations: 'list',
  ProSalle: 'business',
  ProMore: 'ellipsis-horizontal',
};

function makeTabOptions(icons, colors) {
  return ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.warmGray,
    // Sur natif, React Navigation ajoute lui-même l'encoche du bas : figer une
    // hauteur la casserait. Sur le web il n'y a pas d'encoche et la hauteur par
    // défaut rogne le libellé, d'où cette valeur explicite.
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      paddingTop: 6,
      ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8 } : null),
    },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    tabBarIcon: ({ focused, color, size }) => {
      const base = icons[route.name] || 'ellipse';
      return <Ionicons name={focused ? base : `${base}-outline`} size={size - 2} color={color} />;
    },
  });
}

function ClientTabs() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tab.Navigator screenOptions={makeTabOptions(CLIENT_TAB_ICONS, colors)}>
      <Tab.Screen name="Accueil" component={HomeScreen} options={{ title: t('nav.home') }} />
      <Tab.Screen name="Recherche" component={SearchScreen} options={{ title: t('nav.search') }} />
      <Tab.Screen name="Favoris" component={FavoritesScreen} options={{ title: t('nav.favorites') }} />
      <Tab.Screen name="Resa" component={MyReservationsScreen} options={{ title: t('nav.reservations') }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

function ProTabs() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tab.Navigator screenOptions={makeTabOptions(PRO_TAB_ICONS, colors)}>
      <Tab.Screen name="ProDashboard" component={ProDashboardScreen} options={{ title: t('nav.dashboardTab') }} />
      <Tab.Screen name="ProPlanning" component={ProPlanningScreen} options={{ title: t('nav.planning') }} />
      <Tab.Screen
        name="ProReservations"
        component={ProReservationsScreen}
        options={{ title: t('nav.reservations') }}
      />
      <Tab.Screen name="ProSalle" component={ProSalleScreen} options={{ title: t('nav.myHall') }} />
      <Tab.Screen name="ProMore" component={ProMoreScreen} options={{ title: t('nav.more') }} />
    </Tab.Navigator>
  );
}

/** Écrans empilés accessibles depuis les deux espaces. */
function sharedScreens() {
  return (
    <>
      <Stack.Screen name="Salle" component={SalleScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
      <Stack.Screen name="ReviewForm" component={ReviewFormScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </>
  );
}

function RootNavigator() {
  const { user, loading, needsProfile } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      {!user ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Phone" component={PhoneScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
        </>
      ) : needsProfile ? (
        <>
          <Stack.Screen name="Role" component={RoleScreen} />
          <Stack.Screen name="ProOnboarding" component={ProOnboardingScreen} />
        </>
      ) : user.role === ROLES.PRO ? (
        <>
          <Stack.Screen name="ProTabs" component={ProTabs} />
          <Stack.Screen name="ProStats" component={ProStatsScreen} />
          <Stack.Screen name="ProSubscription" component={ProSubscriptionScreen} />
          <Stack.Screen name="ProReviews" component={ProReviewsScreen} />
          <Stack.Screen name="Profil" component={ProfileScreen} />
          {sharedScreens()}
        </>
      ) : (
        <>
          <Stack.Screen name="ClientTabs" component={ClientTabs} />
          <Stack.Screen name="ProOnboarding" component={ProOnboardingScreen} />
          {sharedScreens()}
        </>
      )}
    </Stack.Navigator>
  );
}

function NavigationRoot() {
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.cream,
      card: colors.surface,
      text: colors.dark,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <FavoritesProvider>
              <NavigationRoot />
            </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
