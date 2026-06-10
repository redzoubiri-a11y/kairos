import { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:     '#111827',
  border: 'rgba(255,255,255,0.07)',
  accent: '#c8975a',
  dim:    '#8a9ab0',
};

const CLIENT_TABS = [
  { name: 'Accueil',   label: 'Accueil',  icon: 'home',     route: 'Accueil' },
  { name: 'Recherche', label: 'Rech',     icon: 'search',   route: 'Recherche' },
  { name: 'Favoris',   label: 'Favoris',  icon: 'heart',    route: 'Favoris' },
  { name: 'Resa',      label: 'Resa',     icon: 'calendar', route: 'Resa' },
  { name: 'Profil',    label: 'Profil',   icon: 'person',   route: 'Profil' },
];

const PRO_TABS = [
  { name: 'Accueil',   label: 'Accueil',  icon: 'home',     route: 'Accueil' },
  { name: 'Recherche', label: 'Rech',     icon: 'search',   route: 'Recherche' },
  { name: 'Favoris',   label: 'Favoris',  icon: 'heart',    route: 'Favoris' },
  { name: 'Manager',   label: 'Manager',  icon: 'grid',     route: 'Manager' },
  { name: 'Profil',    label: 'Profil',   icon: 'person',   route: 'Profil' },
];

function TabItem({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();
    onPress();
  }, [scale, onPress]);

  return (
    <TouchableOpacity style={s.tab} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[s.tabInner, { transform: [{ scale }] }]}>
        <Ionicons
          name={isActive ? tab.icon : `${tab.icon}-outline`}
          size={isActive ? 23 : 21}
          color={isActive ? C.accent : C.dim}
        />
        <Text style={[s.label, isActive && s.labelActive]}>{tab.label ?? tab.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function detectManager(navigation) {
  try {
    const state = navigation.getState?.();
    if (!state) return false;
    const routes = state.type === 'tab'
      ? state.routes
      : state.routes?.find(r => r.name === 'Main')?.state?.routes;
    return routes?.some(r => r.name === 'Manager') ?? false;
  } catch { return false; }
}

export default function BottomTabBar({ navigation, isPro = false, activeTab = null }) {
  const insets = useSafeAreaInsets();
  const effectiveIsPro = isPro || detectManager(navigation);
  const tabs = effectiveIsPro ? PRO_TABS : CLIENT_TABS;

  const goTab = useCallback((route) => {
    if (route === 'Profil') {
      navigation.navigate('Profil');
    } else {
      navigation.navigate('Main', { screen: route });
    }
  }, [navigation]);

  return (
    <View style={[s.container, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 16) }]}>
      {tabs.map(tab => (
        <TabItem
          key={tab.name}
          tab={tab}
          isActive={tab.name === activeTab}
          onPress={() => goTab(tab.route)}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label:       { fontSize: 10, letterSpacing: 1, fontWeight: '400', color: C.dim, marginTop: 2 },
  labelActive: { color: C.accent },
});
