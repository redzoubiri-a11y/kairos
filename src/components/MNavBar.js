import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

const CLIENT_TABS = [
  { name: 'Home', icon: '⊞', label: 'Accueil' },
  { name: 'Search', icon: '⊙', label: 'Chercher' },
  { name: 'Favoris', icon: '♡', label: 'Favoris' },
  { name: 'Profil', icon: '◉', label: 'Profil' },
];

const PRO_TABS = [
  { name: 'ProDashboard', icon: '⊞', label: 'Board' },
  { name: 'ProComptoir', icon: '📋', label: 'Réservations' },
  { name: 'ProMenu', icon: '🍽', label: 'Menu' },
  { name: 'ProProfil', icon: '🏪', label: 'Profil' },
];

export default function MNavBar({ state, descriptors, navigation, pro = false }) {
  const tabs = pro ? PRO_TABS : CLIENT_TABS;

  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = tabs[index] || { icon: '○', label: route.name };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const icon =
          options.tabBarIcon
            ? options.tabBarIcon({ focused: isFocused, color: isFocused ? colors.accent : colors.textMuted, size: 20 })
            : tab.icon;

        const label =
          options.tabBarLabel !== undefined ? options.tabBarLabel : tab.label;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            {isFocused && <View style={styles.indicator} />}
            <Text style={[styles.icon, isFocused && styles.iconActive]}>{icon}</Text>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  indicator: {
    position: 'absolute',
    top: -spacing.lg,
    width: 20,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 0,
  },
  icon: {
    fontSize: typography.size.heading2,
    color: colors.textMuted,
  },
  iconActive: {
    color: colors.accent,
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.regular,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: typography.weight.bold,
  },
});
