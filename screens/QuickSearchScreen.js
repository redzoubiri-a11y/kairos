import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';

const TIME_OPTIONS = ['12:00', '13:00', '19:00', '20:00', '21:00'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { greeting: 'Bonjour', moment: 'ce midi' };
  if (h < 18) return { greeting: 'Bon après-midi', moment: 'cet après-midi' };
  return { greeting: 'Bonsoir', moment: 'ce soir' };
}

export default function QuickSearchScreen({ navigation, route }) {
  // Ville affichée = celle sélectionnée sur l'Accueil (onglets Alger/Oran/…), pas
  // une valeur figée — avant ce fix, le bandeau affichait toujours "Alger" même
  // si l'utilisateur avait choisi une autre ville sur l'Accueil.
  const insets    = useSafeAreaInsets();
  const area      = route?.params?.area || 'alger';
  const areaLabel = route?.params?.areaLabel || 'Alger';
  const { greeting, moment } = getGreeting();

  const [mode, setMode] = useState('reserver'); // 'reserver' | 'commander'
  const [dateTomorrow, setDateTomorrow] = useState(false);
  const [timeIdx, setTimeIdx] = useState(TIME_OPTIONS.indexOf('20:00'));
  const [covers, setCovers] = useState(2);

  const cycleTime = useCallback(() => setTimeIdx(i => (i + 1) % TIME_OPTIONS.length), []);

  const ctaLabel = mode === 'reserver' ? '🔍  Rechercher une table' : '🔍  Trouver un restaurant';

  const goSearch = useCallback(() => {
    // 'near' (Près de moi) n'est pas un nom de ville à chercher en texte libre.
    navigation.navigate('Explorer', { mode, initialQuery: area !== 'near' ? areaLabel : undefined });
  }, [navigation, mode, area, areaLabel]);

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
        {/* L'écran est en edges={['left','right']} : sans top, le bouton se
            posait à 32 px du haut, donc sous la barre d'état sur un téléphone à
            encoche (44-59 px) — son tiers supérieur n'attrapait pas les taps et
            il fallait insister. Le max() garde l'apparence d'origine là où
            l'inset est nul (web, anciens écrans). */}
        <TouchableOpacity
          style={[s.backBtn, { marginTop: Math.max(insets.top, spacing.xxl) + spacing.sm }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.heroText}>
          <Text style={s.heroKicker}>{greeting}</Text>
          <Text style={s.heroTitle}>Où mangez-vous{'\n'}{moment} ?</Text>
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

        <Text style={[s.fieldLbl, s.dateLbl]}>Date</Text>
        <View style={s.dateToggle}>
          <TouchableOpacity style={[s.dateSeg, !dateTomorrow && s.dateSegOn]} onPress={() => setDateTomorrow(false)}>
            <Text style={[s.dateSegTxt, !dateTomorrow && s.dateSegTxtOn]}>Aujourd'hui</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.dateSeg, dateTomorrow && s.dateSegOn]} onPress={() => setDateTomorrow(true)}>
            <Text style={[s.dateSegTxt, dateTomorrow && s.dateSegTxtOn]}>Demain</Text>
          </TouchableOpacity>
        </View>

        <View style={s.fieldsRow}>
          {mode === 'reserver' && (
            <View style={s.stepperField}>
              <Text style={s.fieldLbl}>Heure</Text>
              <View style={s.stepper}>
                <TouchableOpacity style={s.stepperBtn} onPress={cycleTime}>
                  <Text style={s.stepperArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={s.stepperVal}>{TIME_OPTIONS[timeIdx]}</Text>
                <TouchableOpacity style={s.stepperBtn} onPress={cycleTime}>
                  <Text style={s.stepperArrow}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={s.stepperField}>
            <Text style={s.fieldLbl}>{mode === 'reserver' ? 'Couverts' : 'Personnes'}</Text>
            <View style={s.stepper}>
              <TouchableOpacity style={s.stepperBtn} onPress={() => setCovers(c => Math.max(1, c - 1))}>
                <Text style={s.stepperArrow}>−</Text>
              </TouchableOpacity>
              <Text style={s.stepperVal}>{covers}</Text>
              <TouchableOpacity style={s.stepperBtn} onPress={() => setCovers(c => Math.min(8, c + 1))}>
                <Text style={s.stepperArrow}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  backBtn:    { width: 36, height: 36, borderRadius: radius.control, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { color: colors.text, fontSize: 15 },

  heroText:   { position: 'absolute', left: spacing.xl, right: spacing.xl, top: 110 },
  heroKicker: { fontFamily: typography.bodyBold, color: colors.card, fontSize: typography.size.caption + 0.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 },
  heroTitle:  { fontFamily: typography.display, color: colors.card, fontSize: 30, lineHeight: 35, marginTop: spacing.md },

  floatCard: {
    position: 'absolute', left: spacing.xl, right: spacing.xl, top: 340,
    backgroundColor: colors.card, borderRadius: radius.xxl - 4, padding: spacing.lg + 2,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 10,
  },

  toggle:      { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.control + 1, padding: 4 },
  toggleSeg:   { flex: 1, alignItems: 'center', paddingVertical: spacing.md + 1, borderRadius: radius.md },
  toggleSegOn: { backgroundColor: colors.noir },
  toggleSegTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 1.5, color: colors.textDim },
  toggleSegTxtOn:{ color: colors.card },

  fieldLbl:  { fontFamily: typography.bodyBold, color: colors.textDim, fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase' },
  dateLbl:   { marginTop: spacing.md + 2 },

  dateToggle:  { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.control, padding: 3, marginTop: spacing.sm - 1 },
  dateSeg:     { flex: 1, alignItems: 'center', paddingVertical: spacing.sm + 3, borderRadius: radius.sm + 2 },
  dateSegOn:   { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  dateSegTxt:  { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 0.5, color: colors.textDim },
  dateSegTxtOn:{ color: colors.text },

  fieldsRow:    { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  stepperField: { flex: 1 },
  stepper:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm - 1, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.control, paddingHorizontal: spacing.sm, height: 42 },
  stepperBtn:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepperArrow: { fontFamily: typography.bodyBold, fontSize: typography.size.heading2, color: colors.primary },
  stepperVal:   { fontFamily: typography.bodyBold, fontSize: typography.size.caption + 1.5, color: colors.text },

  cta:    { marginTop: spacing.md + 2, height: 50, borderRadius: radius.control + 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { fontFamily: typography.bodyBold, color: colors.card, fontSize: typography.size.subheading - 1 },
});
