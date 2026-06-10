import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useSettings, { GROUPS } from '../src/hooks/useSettings';
import BottomTabBar from '../src/components/BottomTabBar';

export default function SettingsScreen({ navigation }) {
  const { toggles, toggle } = useSettings();
  const goAide = useCallback(() => navigation.navigate('Aide'), [navigation]);

  const handleItem = useCallback((item) => {
    if (item.url) {
      Linking.openURL(item.url);
    } else if (item.screen) {
      navigation.navigate(item.screen);
    } else if (item.arrow) {
      Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive dans une prochaine mise à jour.');
    }
  }, [navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Paramètres</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingVertical: spacing.xl, gap: spacing.xl }}>
          {GROUPS.map((group) => (
            <View key={group.section} style={{ paddingHorizontal: spacing.xl }}>
              <Text style={s.sectionLabel}>{group.section}</Text>
              <View style={s.card}>
                {group.items.map((item, i) => {
                  const key = group.section + i;
                  const isLast = i === group.items.length - 1;
                  if (item.toggle) {
                    return (
                      <View key={i} style={[r.row, !isLast && r.border]}>
                        <View style={{ flex: 1 }}>
                          <Text style={r.label}>{item.label}</Text>
                          {!!item.sub && <Text style={r.sub}>{item.sub}</Text>}
                        </View>
                        <Switch
                          value={!!toggles[key]}
                          onValueChange={() => toggle(key)}
                          trackColor={{ false: colors.cardBorder, true: colors.accent + '80' }}
                          thumbColor={toggles[key] ? colors.accent : colors.textDim}
                          ios_backgroundColor={colors.cardBorder}
                        />
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[r.row, !isLast && r.border]}
                      activeOpacity={item.arrow ? 0.7 : 1}
                      onPress={() => handleItem(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={r.label}>{item.label}</Text>
                        {!!item.sub && <Text style={r.sub}>{item.sub}</Text>}
                      </View>
                      {item.arrow && <Text style={r.arrow}>›</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={{ paddingHorizontal: spacing.xl }}>
            <Text style={s.sectionLabel}>❓ Aide</Text>
            <View style={s.card}>
              <TouchableOpacity style={[r.row, r.border]} onPress={goAide}>
                <Text style={r.label}>Centre d'aide & FAQ</Text>
                <Text style={r.arrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={r.row} onPress={() => Linking.openURL('mailto:contact@mida-food.com?subject=Signalement%20problème')}>
                <Text style={r.label}>Signaler un problème</Text>
                <Text style={r.arrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
      <BottomTabBar navigation={navigation} activeTab={null} />
    </SafeAreaView>
  );
}

const r = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
  border: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  label:  { color: colors.text, fontSize: typography.size.body },
  sub:    { color: colors.textDim, fontSize: typography.size.xs, marginTop: 2 },
  arrow:  { color: colors.textDim, fontSize: typography.size.subheading },
});

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backBtn:      { padding: spacing.xs },
  backBtnTxt:   { color: colors.text, fontSize: 22 },
  title:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  sectionLabel: { color: colors.accent, fontSize: typography.size.xs, fontWeight: typography.weight.bold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md },
  card:         { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
});
