import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './supabase';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const C = {
  bg: '#0d1628', bg2: '#111827',
  border: 'rgba(255,255,255,0.07)',
  accent: '#c8975a', dim: '#8a9ab0', text: '#f0ece4',
};

const TAB_ICON = {
  Recherche: { off: '🔍', on: '🔍' },
  Explorer:  { off: '🗺️',  on: '🗺️'  },
  Favoris:   { off: '🤍', on: '❤️'  },
  Resa:      { off: '📅', on: '📅'  },
  Manager:   { off: '🍽️', on: '🍽️'  },
};

function TabIcon({ name, focused }) {
  const icons = TAB_ICON[name] || { off: '●', on: '●' };
  return <Text style={{ fontSize: 20 }}>{focused ? icons.on : icons.off}</Text>;
}

function TabNavigator({ userRole }) {
  const isManager = userRole === 'manager';
  const LastScreen = isManager ? ProDashboard : ReservationScreen;
  const lastName   = isManager ? 'Manager' : 'Resa';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bg2,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: 34,
          paddingTop: 10,
          height: 80,
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.dim,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5, fontWeight: '300' },
      }}
    >
      <Tab.Screen
        name="Recherche"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Recherche" focused={focused} /> }}
      />
      <Tab.Screen
        name="Explorer"
        component={ExplorerScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Explorer" focused={focused} /> }}
      />
      <Tab.Screen
        name="Favoris"
        component={FavorisScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Favoris" focused={focused} /> }}
      />
      <Tab.Screen
        name={lastName}
        component={LastScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name={lastName} focused={focused} /> }}
      />
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

  function renderContent() {
    if (loading) {
      return (
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.accent, fontSize: 28, fontWeight: '300', letterSpacing: 8 }}>MIDA</Text>
        </View>
      );
    }
    if (!session && !userType) return <OnboardingScreen onSelect={setUserType} />;
    if (!session) return <AuthScreen userType={userType} onAuth={(s) => setSession(s)} />;
    return (
      <NavigationContainer>
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
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return <SafeAreaProvider>{renderContent()}</SafeAreaProvider>;
}
