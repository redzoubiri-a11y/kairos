import { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors as theme, typography } from '../theme';

const C = {
  accent:   theme.primary,
  dim:      theme.textDim,
  activeBg: theme.primarySoft,
};

const CLIENT_TABS = [
  { name: 'Accueil',   label: 'Accueil',  route: 'Accueil',  icon: 'home',     iconOff: 'home-outline' },
  { name: 'Recherche', label: 'Explorer', route: 'Recherche',icon: 'search',   iconOff: 'search-outline' },
  { name: 'Resa',      label: 'Résas',    route: 'Resa',     icon: 'calendar', iconOff: 'calendar-outline' },
  { name: 'Favoris',   label: 'Favoris',  route: 'Favoris',  icon: 'heart',    iconOff: 'heart-outline' },
  { name: 'Profil',    label: 'Profil',   route: 'Profil',   icon: 'person',   iconOff: 'person-outline' },
];

const PRO_TABS = [
  { name: 'Accueil',   label: 'Accueil',  route: 'Accueil',  icon: 'home',     iconOff: 'home-outline' },
  { name: 'Recherche', label: 'Explorer', route: 'Recherche',icon: 'search',   iconOff: 'search-outline' },
  { name: 'Manager',   label: 'Manager',  route: 'Manager',  icon: 'grid',     iconOff: 'grid-outline' },
  { name: 'Favoris',   label: 'Favoris',  route: 'Favoris',  icon: 'heart',    iconOff: 'heart-outline' },
  { name: 'Profil',    label: 'Profil',   route: 'Profil',   icon: 'person',   iconOff: 'person-outline' },
];

function TabItem({ tab, isActive, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const colors = C;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.84, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 12 }),
    ]).start();
    onPress();
  }, [scale, onPress]);

  return (
    <TouchableOpacity style={s.tab} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[
        s.tabInner,
        isActive && { backgroundColor: colors.activeBg },
        { transform: [{ scale }] },
      ]}>
        <Ionicons
          name={isActive ? tab.icon : tab.iconOff}
          size={18}
          color={isActive ? colors.accent : colors.dim}
        />
        <Text style={[s.label, { color: isActive ? colors.accent : colors.dim }]} numberOfLines={1}>
          {tab.label}
        </Text>
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
    const parent = navigation.getParent?.();
    if (parent) {
      const ps = parent.getState?.();
      if (ps?.type === 'tab') return ps.routes?.some(r => r.name === 'Manager') ?? false;
    }
    return false;
  } catch { return false; }
}

export default function BottomTabBar({ navigation, isPro = false, activeTab = null, transparent = false }) {
  const insets = useSafeAreaInsets();
  const [effectiveIsPro, setEffectiveIsPro] = useState(() => isPro || detectManager(navigation));

  useEffect(() => {
    if (effectiveIsPro) return;
    if (detectManager(navigation)) { setEffectiveIsPro(true); return; }
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
      <View style={[s.container, transparent && s.containerTransparent]}>
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.cardBorder,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 8,
    height: 58,
  },
  containerTransparent: {
    backgroundColor: theme.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tabInnerActive: {
    backgroundColor: C.activeBg,
  },
  label: {
    fontFamily: typography.body,
    fontSize: typography.size.xs,
    letterSpacing: 0.5,
    fontWeight: '400',
    color: C.dim,
  },
  labelActive: {
    color: C.accent,
    fontFamily: typography.bodySemibold,
    fontWeight: '600',
  },
});
