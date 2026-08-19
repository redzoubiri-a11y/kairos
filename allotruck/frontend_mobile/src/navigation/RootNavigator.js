import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeMapScreen from '../screens/HomeMapScreen';
import MissionFormScreen from '../screens/MissionFormScreen';
import MissionsScreen from '../screens/MissionsScreen';
import MissionsReceivedScreen from '../screens/MissionsReceivedScreen';
import MissionDetailScreen from '../screens/MissionDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import DeclareRouteScreen from '../screens/DeclareRouteScreen';
import MyTrucksScreen from '../screens/MyTrucksScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useNotificationStore } from '../store/notificationStore';
import { useRealtime } from '../hooks/useRealtime';
import { usePushResponse } from '../hooks/usePushResponse';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['map', 'map-outline'],
  Missions: ['clipboard', 'clipboard-outline'],
  MissionsReceived: ['mail', 'mail-outline'],
  DeclareRoute: ['megaphone', 'megaphone-outline'],
  Notifications: ['notifications', 'notifications-outline'],
  Profile: ['person', 'person-outline'],
};

function useTabScreenOptions() {
  // A fixed tabBarStyle height opts out of react-navigation's automatic
  // safe-area handling, so on Android edge-to-edge devices (edgeToEdgeEnabled
  // in app.json) the bar was drawn underneath the system gesture nav bar and
  // effectively unreachable/invisible. Add the inset back in manually.
  const insets = useSafeAreaInsets();

  return ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primaryDark,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: {
      borderTopColor: colors.border,
      height: 62 + insets.bottom,
      paddingBottom: insets.bottom + 8,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    tabBarIcon: ({ focused, color, size }) => {
      const [active, inactive] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
      return <Ionicons name={focused ? active : inactive} size={size - 2} color={color} />;
    },
  });
}

function ClientTabs() {
  const unread = useNotificationStore((s) => s.items.filter((n) => !n.readAt).length);
  const screenOptions = useTabScreenOptions();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeMapScreen} options={{ title: 'Carte' }} />
      <Tab.Screen name="Missions" component={MissionsScreen} options={{ title: 'Missions' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Alertes', tabBarBadge: unread || undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

function TransporterTabs() {
  const pending = useMissionStore((s) => s.items.filter((m) => m.status === 'PENDING').length);
  const unread = useNotificationStore((s) => s.items.filter((n) => !n.readAt).length);
  const screenOptions = useTabScreenOptions();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="MissionsReceived"
        component={MissionsReceivedScreen}
        options={{ title: 'Demandes', tabBarBadge: pending || undefined }}
      />
      <Tab.Screen name="DeclareRoute" component={DeclareRouteScreen} options={{ title: 'Declarer' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Alertes', tabBarBadge: unread || undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.onboarded);
  const role = useAuthStore((s) => s.user?.role);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  const navigationRef = useRef(null);
  const [navigationReady, setNavigationReady] = useState(false);

  useRealtime();
  usePushResponse(navigationRef, navigationReady && status === 'signedIn');

  useEffect(() => {
    bootstrap();
    // Filet de secours : si bootstrap() ne resout jamais (module natif qui
    // pend au lieu de rejeter), le splash ne doit pas rester bloque a vie.
    const timeout = setTimeout(() => {
      if (useAuthStore.getState().status === 'loading') {
        console.error('[RootNavigator] bootstrap timeout, forcing signedOut');
        useAuthStore.getState().forceSignedOutAfterTimeout();
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [bootstrap]);

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavigationReady(true)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'loading' ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : status === 'signedOut' ? (
          <>
            {!onboarded ? <Stack.Screen name="Onboarding" component={OnboardingScreen} /> : null}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Tabs"
              component={role === 'TRANSPORTER' ? TransporterTabs : ClientTabs}
            />
            <Stack.Screen name="MissionForm" component={MissionFormScreen} />
            <Stack.Screen name="MissionDetail" component={MissionDetailScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="MyTrucks" component={MyTrucksScreen} />
            <Stack.Screen name="MyTrips" component={MyTripsScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
