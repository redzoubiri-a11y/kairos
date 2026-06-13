import { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:     'rgba(255,255,255,0.97)',
  border: 'rgba(0,0,0,0.06)',
  accent: '#0D1628',
  dim:    '#b0bec5',
  activeBg: 'rgba(13,22,40,0.08)',
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
      <Animated.View style={[s.tabInner, isActive && s.tabInnerActive, { transform: [{ scale }] }]}>
        <Ionicons
          name={isActive ? tab.icon : `${tab.icon}-outline`}
          size={isActive ? 22 : 20}
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
    if (routes) return routes.some(r => r.name === 'Manager');
    // Fallback: check parent navigator
    const parent = navigation.getParent?.();
    if (parent) {
      const ps = parent.getState?.();
      if (ps?.type === 'tab') return ps.routes?.some(r => r.name === 'Manager') ?? false;
    }
    return false;
  } catch { return false; }
}

export default function BottomTabBar({ navigation, isPro = false, activeTab = null }) {
  const insets = useSafeAreaInsets();

  // Sticky detection: once resolved as pro, never revert to client
  const [effectiveIsPro, setEffectiveIsPro] = useState(() => isPro || detectManager(navigation));

  useEffect(() => {
    if (effectiveIsPro) return;
    // Check immediately (state might not be ready on first render)
    if (detectManager(navigation)) { setEffectiveIsPro(true); return; }
    // Subscribe to state changes to detect as soon as it's available
    const unsub = navigation.addListener?.('state', () => {
      if (detectManager(navigation)) setEffectiveIsPro(true);
    });
    return unsub;
  }, [navigation, effectiveIsPro]);

  const tabs = effectiveIsPro ? PRO_TABS : CLIENT_TABS;

  const goTab = useCallback((route) => {
    navigation.navigate('Main', { screen: route });
  }, [navigation]);

  return (
    <View style={[s.outerWrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12) }]}>
      <View style={s.container}>
        {tabs.map(tab => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={tab.name === activeTab}
            onPress={() => goTab(tab.route)}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 36,
    paddingTop: 6,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tabInnerActive: {
    backgroundColor: C.activeBg,
  },
  label:       { fontSize: 10, letterSpacing: 0.5, fontWeight: '400', color: C.dim, marginTop: 1 },
  labelActive: { color: C.accent, fontWeight: '600' },
});
