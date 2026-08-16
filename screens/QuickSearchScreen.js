import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';

const TIME_OPTIONS = ['12:00', '13:00', '19:00', '20:00', '21:00'];

export default function QuickSearchScreen({ navigation }) {
  const [mode, setMode] = useState('reserver'); // 'reserver' | 'commander'
  const [dateTomorrow, setDateTomorrow] = useState(false);
  const [timeIdx, setTimeIdx] = useState(TIME_OPTIONS.indexOf('20:00'));
  const [covers, setCovers] = useState(2);

  const cycleTime   = useCallback(() => setTimeIdx(i => (i + 1) % TIME_OPTIONS.length), []);
  const cycleCovers = useCallback(() => setCovers(c => (c >= 8 ? 1 : c + 1)), []);

  const ctaLabel = mode === 'reserver' ? '🔍  Rechercher une table' : '🔍  Trouver un restaurant';

  const goSearch = useCallback(() => {
    navigation.navigate('Explorer');
  }, [navigation]);

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>
      <LinearGradient
        colors={['rgba(20,16,10,0.15)', 'rgba(20,16,10,0.55)']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={colors.heroWarmGradient}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.heroText}>
          <Text style={s.heroKicker}>Alger</Text>
          <Text style={s.heroTitle}>Où mangez-vous{'\n'}ce soir ?</Text>
        </View>
      </LinearGradient>

      <View style={s.floatCard}>
        <View style={s.toggle}>
          <TouchableOpacity style={[s.toggleSeg, mode === 'reserver' && s.toggleSegOn]} onPress={() => setMode('reserver')}>
            <Text style={[s.toggleSegTxt, mode === 'reserver' && s.toggleSegTxtOn]}>Réserver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleSeg, mode === 'commander' && s.toggleSegOn]} onPress={() => setMode('commander')}>
            <Text style={[s.toggleSegTxt, mode === 'commander' && s.toggleSegTxtOn]}>Commander</Text>
          </TouchableOpacity>
        </View>

        <View style={s.fieldsRow}>
          <TouchableOpacity style={s.field} onPress={() => setDateTomorrow(v => !v)}>
            <Text style={s.fieldLbl}>Date</Text>
            <Text style={s.fieldVal}>{dateTomorrow ? 'Demain' : "Aujourd'hui"}</Text>
          </TouchableOpacity>
          {mode === 'reserver' && (
            <TouchableOpacity style={s.field} onPress={cycleTime}>
              <Text style={s.fieldLbl}>Heure</Text>
              <Text style={s.fieldVal}>{TIME_OPTIONS[timeIdx]}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.field} onPress={cycleCovers}>
            <Text style={s.fieldLbl}>{mode === 'reserver' ? 'Couverts' : 'Pers.'}</Text>
            <Text style={s.fieldVal}>{covers} pers.</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.cta} onPress={goSearch} activeOpacity={0.9}>
          <Text style={s.ctaTxt}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },

  hero: { height: 430, paddingHorizontal: spacing.xl },
  backBtn:    { marginTop: spacing.xxl + 8, width: 36, height: 36, borderRadius: radius.control, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: colors.text, fontSize: 15 },

  heroText:   { position: 'absolute', left: spacing.xl, right: spacing.xl, top: 110 },
  heroKicker: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.caption + 0.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 },
  heroTitle:  { fontFamily: typography.display, color: '#FFFFFF', fontSize: 30, lineHeight: 35, marginTop: spacing.md },

  floatCard: {
    position: 'absolute', left: spacing.xl, right: spacing.xl, top: 340,
    backgroundColor: '#FFFFFF', borderRadius: radius.xxl - 4, padding: spacing.lg + 2,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 10,
  },

  toggle:      { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.control + 1, padding: 4 },
  toggleSeg:   { flex: 1, alignItems: 'center', paddingVertical: spacing.md + 1, borderRadius: radius.md },
  toggleSegOn: { backgroundColor: colors.noir },
  toggleSegTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 1.5, color: colors.textDim },
  toggleSegTxtOn:{ color: '#FFFFFF' },

  fieldsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md + 2 },
  field:     { flex: 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.control, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  fieldLbl:  { fontFamily: typography.bodyBold, color: colors.textDim, fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase' },
  fieldVal:  { fontFamily: typography.bodyBold, color: colors.text, fontSize: typography.size.caption + 1, marginTop: 2 },

  cta:    { marginTop: spacing.md + 2, height: 50, borderRadius: radius.control + 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.subheading - 1 },
});
