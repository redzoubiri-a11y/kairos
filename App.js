import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabase';
import { linkingConfig } from './src/linking';
import OnboardingScreen from './screens/OnboardingScreen';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const C = {
  bg: '#0d1628', bg2: 'transparent',
  border: 'transparent',
  accent: '#0D1628', dim: '#b0bec5', text: '#f0ece4',
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
          backgroundColor: 'rgba(13,22,40,0.13)',
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
  const isManager = userRole === 'manager';
  const LastScreen = isManager ? ProDashboard : ReservationScreen;
  const lastName   = isManager ? 'Manager' : 'Resa';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 36,
          paddingBottom: 8,
          paddingTop: 8,
          height: 66,
          elevation: 16,
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.dim,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5, fontWeight: '400', marginTop: 1 },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Recherche" component={ExplorerScreen} />
      <Tab.Screen name="Favoris" component={FavorisScreen} />
      <Tab.Screen name={lastName} component={LastScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [userType, setUserType] = useState(null);
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

  const [webUserType, setWebUserType] = useState('client');

  function renderContent() {
    if (loading) {
      return (
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.accent, fontSize: 28, fontWeight: '300', letterSpacing: 8 }}>MIDA</Text>
        </View>
      );
    }
    if (!session && !userType) {
      if (Platform.OS === 'web') return <AuthScreen userType={webUserType} onAuth={(s) => setSession(s)} onSwitchType={setWebUserType} />;
      return <OnboardingScreen onSelect={setUserType} />;
    }
    if (!session) return <AuthScreen userType={userType} onAuth={(s) => setSession(s)} />;
    return (
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
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return <SafeAreaProvider>{renderContent()}</SafeAreaProvider>;
}
