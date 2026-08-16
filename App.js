import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import {
  WorkSans_400Regular, WorkSans_500Medium, WorkSans_600SemiBold,
  WorkSans_700Bold, WorkSans_800ExtraBold,
} from '@expo-google-fonts/work-sans';
import { supabase } from './supabase';
import { GuestContext } from './src/context/GuestContext';
import { linkingConfig } from './src/linking';
import HomeScreen from './screens/HomeScreen';
import ExplorerScreen from './screens/ExplorerScreen';
import FavorisScreen from './screens/FavorisScreen';
import ReservationScreen from './screens/ReservationScreen';
import ProDashboard from './screens/ProDashboard';
import RestaurantScreen from './screens/RestaurantScreen';
import ReservationFormScreen from './screens/ReservationFormScreen';
import AuthScreen from './screens/AuthScreen';
import ProInscriptionScreen from './screens/ProInscriptionScreen';
import ProfilScreen from './screens/ProfilScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SearchScreen from './screens/SearchScreen';
import ProComptoir from './screens/ProComptoir';
import ProPromosScreen from './screens/ProPromosScreen';
import ProAvisScreen from './screens/ProAvisScreen';
import ProMenuScreen from './screens/ProMenuScreen';
import ProPhotosScreen from './screens/ProPhotosScreen';
import SettingsScreen from './screens/SettingsScreen';
import AideScreen from './screens/AideScreen';
import MapScreen from './screens/MapScreen';
import ProInfoScreen from './screens/ProInfoScreen';
import ProHorairesScreen from './screens/ProHorairesScreen';
import AdminValidationScreen from './screens/AdminValidationScreen';
import ClickCollectScreen from './screens/ClickCollectScreen';
import ProOrdersScreen from './screens/ProOrdersScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import ProTableQrScreen from './screens/ProTableQrScreen';
import QuickSearchScreen from './screens/QuickSearchScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const C = {
  bg: '#F5F5F3', bg2: 'transparent',
  border: '#E7E6E1',
  accent: '#D8432B', dim: 'rgba(25,25,25,0.62)', text: '#191919',
};

const TAB_ICONS = {
  Accueil:  { active: 'home',            inactive: 'home-outline' },
  Recherche:{ active: 'search',          inactive: 'search-outline' },
  Favoris:  { active: 'heart',           inactive: 'heart-outline' },
  Manager:  { active: 'grid',            inactive: 'grid-outline' },
  Resa:     { active: 'calendar',        inactive: 'calendar-outline' },
  Profil:   { active: 'person',          inactive: 'person-outline' },
};

function TabIcon({ name, focused }) {
  const icons = TAB_ICONS[name] || { active: 'ellipse', inactive: 'ellipse-outline' };
  const iconName = focused ? icons.active : icons.inactive;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 32, height: 28 }}>
      {focused && (
        <View style={{
          position: 'absolute', width: 40, height: 32, borderRadius: 16,
          backgroundColor: 'rgba(216,67,43,0.10)',
        }} />
      )}
      <Ionicons
        name={iconName}
        size={focused ? 22 : 20}
        color={focused ? C.accent : C.dim}
      />
    </View>
  );
}


function TabNavigator({ userRole }) {
  const isManager = userRole === 'manager' || userRole === 'admin';
  const LastScreen = isManager ? ProDashboard : ReservationScreen;
  const lastName   = isManager ? 'Manager' : 'Resa';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderTopWidth: 0,
          marginHorizontal: 0,
          marginBottom: 0,
          borderRadius: 0,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
          height: 58 + insets.bottom,
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.dim,
        tabBarLabelStyle: { fontFamily: 'Work Sans Medium', fontSize: 10, letterSpacing: 0.5, marginTop: 1 },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Recherche" component={ExplorerScreen} />
      <Tab.Screen name={lastName} component={LastScreen} />
      <Tab.Screen name="Favoris" component={FavorisScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Work Sans': WorkSans_400Regular,
    'Work Sans Medium': WorkSans_500Medium,
    'Work Sans SemiBold': WorkSans_600SemiBold,
    'Work Sans Bold': WorkSans_700Bold,
    'Work Sans ExtraBold': WorkSans_800ExtraBold,
  });
  const [session, setSession]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [userRole, setUserRole]     = useState('user');

  function applyRoleFromSession(s) {
    if (!s?.user) return;
    const u = s.user;
    const role = u.app_metadata?.role || u.user_metadata?.role || 'user';
    setUserRole(role);
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        const s = data?.session ?? null;
        setSession(s);
        applyRoleFromSession(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) applyRoleFromSession(session);
      else setUserRole('user');
    });
    return () => subscription.unsubscribe();
  }, []);

  // Type affiché sur l'écran de connexion (client/pro) — cosmétique uniquement,
  // le rôle réel vient de app_metadata côté serveur après connexion.
  const [authType, setAuthType] = useState('client');

  function renderContent() {
    if (loading || !fontsLoaded) {
      return (
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.accent, fontSize: 28, fontFamily: fontsLoaded ? 'Work Sans ExtraBold' : undefined, fontWeight: fontsLoaded ? undefined : '300', letterSpacing: 8 }}>MIDA</Text>
        </View>
      );
    }
    // Entrée libre : jamais de gate au lancement (ni onboarding, ni connexion forcée).
    // Sans session = invité, qui peut parcourir toute l'app ; les écrans sensibles
    // (réserver, commander) affichent eux-mêmes un GuestWall qui renvoie vers "Auth".
    return (
      <GuestContext.Provider value={{ isGuest: !session }}>
        <NavigationContainer linking={linkingConfig}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">{() => <TabNavigator userRole={userRole} />}</Stack.Screen>
            <Stack.Screen name="Restaurant" component={RestaurantScreen} />
            <Stack.Screen name="ReservationForm" component={ReservationFormScreen} />
            <Stack.Screen name="ProInscription" component={ProInscriptionScreen} />
            <Stack.Screen name="Profil" component={ProfilScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="ProComptoir" component={ProComptoir} />
            <Stack.Screen name="Explorer" component={ExplorerScreen} />
            <Stack.Screen name="ProPromos" component={ProPromosScreen} />
            <Stack.Screen name="ProAvis" component={ProAvisScreen} />
            <Stack.Screen name="ProMenu" component={ProMenuScreen} />
            <Stack.Screen name="ProPhotos" component={ProPhotosScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Aide" component={AideScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="ProInfo" component={ProInfoScreen} />
            <Stack.Screen name="ProHoraires" component={ProHorairesScreen} />
            <Stack.Screen name="AdminValidation" component={AdminValidationScreen} />
            <Stack.Screen name="ClickCollect" component={ClickCollectScreen} />
            <Stack.Screen name="ProOrders" component={ProOrdersScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="ProTableQr" component={ProTableQrScreen} />
            <Stack.Screen name="QuickSearch" component={QuickSearchScreen} />
            <Stack.Screen name="Auth">
              {({ navigation }) => (
                <AuthScreen
                  userType={authType}
                  onSwitchType={setAuthType}
                  onAuth={(s) => { setSession(s); navigation.goBack(); }}
                  onGuest={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </GuestContext.Provider>
    );
  }

  return <SafeAreaProvider>{renderContent()}</SafeAreaProvider>;
}
