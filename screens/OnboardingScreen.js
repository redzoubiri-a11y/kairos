import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';

const SLIDES = [
  {
    emoji: '🔍',
    tag: 'DÉCOUVERTE',
    title: 'Trouve ton resto\nen 10 secondes',
    sub: 'Parcours les meilleurs restaurants d\'Alger, filtre par quartier, cuisine et budget.',
    chips: ['347 restaurants', '100% avis vérifiés', 'Résa en 30s'],
    accentColor: colors.accent,
    ringBg: colors.accentSoft,
    ringBorder: 'rgba(232,160,69,0.25)',
  },
  {
    emoji: '📅',
    tag: 'RÉSERVATION',
    title: 'Réserve\nsans appeler',
    sub: 'Choisis ton créneau, ton nombre de couverts, et c\'est confirmé instantanément.',
    chips: ['Zéro appel', 'Confirmation rapide', 'Annulation libre'],
    accentColor: colors.green,
    ringBg: colors.greenSoft,
    ringBorder: 'rgba(76,175,130,0.25)',
  },
  {
    emoji: '⭐',
    tag: 'CONFIANCE',
    title: 'Des avis\n100% vérifiés',
    sub: 'Chaque note vient d\'un client ayant vraiment réservé. Pas de faux avis.',
    chips: ['Avis certifiés', 'Notes fiables', 'Expériences réelles'],
    accentColor: colors.blue,
    ringBg: colors.blueSoft,
    ringBorder: 'rgba(90,155,224,0.25)',
  },
];

const CITIES = [
  { id: 'alger',       label: 'Alger',       emoji: '🏛️', sub: 'Capitale',        count: '20+' },
  { id: 'oran',        label: 'Oran',         emoji: '🌊', sub: 'Ville du Ponant',  count: '10+' },
  { id: 'constantine', label: 'Constantine',  emoji: '🌉', sub: 'Cité des Ponts',   count: '5+'  },
];

function Dots({ total, current, accentColor }) {
  return (
    <View style={d.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            d.dot,
            i === current
              ? { backgroundColor: accentColor || colors.accent, width: 22 }
              : i < current
              ? { backgroundColor: colors.accentDim, width: 6 }
              : { backgroundColor: colors.cardBorder, width: 6 },
          ]}
        />
      ))}
    </View>
  );
}
const d = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },
});

export default function OnboardingScreen({ onSelect }) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  const TOTAL = 5;

  const goTo = useCallback((next) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(24);
      scaleAnim.setValue(0.78);
      setTimeout(() => {
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();
      }, 0);
    });
  }, []);

  useEffect(() => {
    scaleAnim.setValue(0.78);
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  const goToFinal  = useCallback(() => goTo(4), [goTo]);
  const goToNext   = useCallback(() => goTo(step + 1), [goTo, step]);
  const goContinue = useCallback(() => city && goTo(4), [city, goTo]);
  const goClient   = useCallback(() => onSelect('client'), [onSelect]);
  const goPro      = useCallback(() => onSelect('pro'), [onSelect]);

  /* ── Slides intro (0–2) ── */
  if (step <= 2) {
    const sl = SLIDES[step];
    return (
      <SafeAreaView style={s.root}>
        <Animated.View style={[s.slideWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={[s.tag, { borderColor: sl.ringBorder, backgroundColor: sl.ringBg }]}>
            <View style={[s.tagDot, { backgroundColor: sl.accentColor }]} />
            <Text style={[s.tagTxt, { color: sl.accentColor }]}>{sl.tag}</Text>
          </View>

          <Animated.View style={[s.emojiOuter, { borderColor: sl.ringBorder, backgroundColor: sl.ringBg, transform: [{ scale: scaleAnim }] }]}>
            <View style={[s.emojiInner, { backgroundColor: sl.ringBg, borderColor: sl.ringBorder }]}>
              <Text style={s.mainEmoji}>{sl.emoji}</Text>
            </View>
          </Animated.View>

          <Text style={s.slideTitle}>{sl.title}</Text>
          <Text style={s.slideSub}>{sl.sub}</Text>

          <View style={s.chipsRow}>
            {sl.chips.map((chip, i) => (
              <View key={i} style={[s.chip, { borderColor: sl.ringBorder, backgroundColor: sl.ringBg }]}>
                <Text style={[s.chipTxt, { color: sl.accentColor }]}>{chip}</Text>
              </View>
            ))}
          </View>

        </Animated.View>

        <View style={s.footer}>
          <Dots total={TOTAL} current={step} accentColor={sl.accentColor} />
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.skipBtn} onPress={goToFinal} activeOpacity={0.6}>
              <Text style={s.skipTxt}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nextBtn, { backgroundColor: sl.accentColor }]}
              onPress={goToNext}
              activeOpacity={0.85}
            >
              <Text style={s.nextTxt}>{step === 2 ? 'Commencer  ✦' : 'Suivant  →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Étape 3 : Ville ── */
  if (step === 3) {
    return (
      <SafeAreaView style={s.root}>
        <Animated.View style={[s.stepWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={s.stepHeader}>
            <Text style={s.stepTag}>VOTRE VILLE</Text>
            <Text style={s.stepTitle}>Où êtes-vous ?</Text>
            <Text style={s.stepSub}>Personnalisez votre expérience selon{'\n'}votre ville.</Text>
          </View>

          <View style={s.cityCards}>
            {CITIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.cityCard, city === c.id && s.cityCardOn]}
                onPress={() => setCity(c.id)}
                activeOpacity={0.78}
              >
                <View style={[s.cityEmojiWrap, city === c.id && s.cityEmojiWrapOn]}>
                  <Text style={s.cityEmoji}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cityLabel, city === c.id && s.cityLabelOn]}>{c.label}</Text>
                  <Text style={s.citySub}>{c.sub}</Text>
                </View>
                <View style={s.cityCountBadge}>
                  <Text style={[s.cityCount, city === c.id && { color: colors.accent }]}>{c.count}</Text>
                  <Text style={s.cityCountLbl}>tables</Text>
                </View>
                {city === c.id
                  ? <View style={s.cityCheck}><Text style={s.cityCheckTxt}>✓</Text></View>
                  : <View style={s.cityUncheck} />
                }
              </TouchableOpacity>
            ))}
          </View>

        </Animated.View>

        <View style={s.footer}>
          <Dots total={TOTAL} current={3} accentColor={colors.accent} />
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.skipBtn} onPress={goToFinal} activeOpacity={0.6}>
              <Text style={s.skipTxt}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nextBtn, !city && s.nextBtnDim]}
              onPress={goContinue}
              disabled={!city}
              activeOpacity={0.85}
            >
              <Text style={s.nextTxt}>Continuer  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Étape 4 : Rôle ── */
  return (
    <SafeAreaView style={s.root}>
      <Animated.View style={[s.stepWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <View style={s.stepHeader}>
          <Text style={s.logoMain}>mida</Text>
          <Text style={s.stepTitle}>Vous êtes…</Text>
          <Text style={s.stepSub}>Choisissez votre profil pour commencer.</Text>
        </View>

        <TouchableOpacity style={[s.roleCard, s.roleCardClient]} onPress={goClient} activeOpacity={0.82}>
          <View style={[s.roleIconWrap, { backgroundColor: colors.blueSoft, borderColor: 'rgba(90,155,224,0.3)' }]}>
            <Text style={s.roleEmoji}>🍽️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.roleTitle}>Je cherche une table</Text>
            <Text style={s.roleDesc}>Découvrir, réserver et savourer les meilleures adresses</Text>
            <View style={s.roleChips}>
              {['Explorer', 'Réserver', 'Favoris'].map((t, i) => (
                <View key={i} style={s.roleChipSmall}><Text style={s.roleChipTxt}>{t}</Text></View>
              ))}
            </View>
          </View>
          <View style={[s.roleArrowWrap, { backgroundColor: colors.blueSoft }]}>
            <Text style={[s.roleArrow, { color: colors.blue }]}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={s.roleSep}>
          <View style={s.roleSepLine} />
          <Text style={s.roleSepTxt}>OU</Text>
          <View style={s.roleSepLine} />
        </View>

        <TouchableOpacity style={[s.roleCard, s.roleCardPro]} onPress={goPro} activeOpacity={0.82}>
          <View style={[s.roleIconWrap, { backgroundColor: colors.accentSoft, borderColor: 'rgba(232,160,69,0.3)' }]}>
            <Text style={s.roleEmoji}>📊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.roleTitle, { color: colors.accent }]}>J'ai un restaurant</Text>
            <Text style={s.roleDesc}>Gérer mes réservations et ma visibilité sur Mida</Text>
            <View style={s.roleChips}>
              {['Dashboard', 'Comptoir'].map((t, i) => (
                <View key={i} style={[s.roleChipSmall, { borderColor: 'rgba(232,160,69,0.3)', backgroundColor: colors.accentSoft }]}>
                  <Text style={[s.roleChipTxt, { color: colors.accent }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[s.roleArrowWrap, { backgroundColor: colors.accentSoft }]}>
            <Text style={[s.roleArrow, { color: colors.accent }]}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={s.legal}>En continuant, vous acceptez nos conditions{'\n'}d'utilisation et notre politique de confidentialité.</Text>

      </Animated.View>

      <View style={[s.footer, { paddingBottom: spacing.lg }]}>
        <Dots total={TOTAL} current={4} accentColor={colors.accent} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  /* Slides */
  slideWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  tag:          { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 100, borderWidth: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginBottom: spacing.section },
  tagDot:       { width: 5, height: 5, borderRadius: 3 },
  tagTxt:       { fontSize: typography.size.xs, letterSpacing: 3, fontWeight: typography.weight.semibold },
  emojiOuter:   { width: 148, height: 148, borderRadius: 40, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.section + 4 },
  emojiInner:   { width: 108, height: 108, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mainEmoji:    { fontSize: 56 },
  slideTitle:   { color: colors.text, fontSize: typography.size.hero, fontWeight: typography.weight.regular, letterSpacing: 0.3, textAlign: 'center', lineHeight: 40, marginBottom: spacing.xl },
  slideSub:     { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xxl + 4, paddingHorizontal: spacing.md },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  chip:         { borderRadius: 100, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  chipTxt:      { fontSize: typography.size.caption, fontWeight: typography.weight.regular },

  /* Étapes */
  stepWrap:     { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  stepHeader:   { alignItems: 'center', marginBottom: spacing.section },
  stepTag:      { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3, fontWeight: typography.weight.semibold, marginBottom: spacing.lg },
  stepTitle:    { color: colors.text, fontSize: typography.size.hero, fontWeight: typography.weight.regular, letterSpacing: 0.3, marginBottom: spacing.md, textAlign: 'center' },
  stepSub:      { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },
  logoMain:     { color: colors.accent, fontSize: typography.size.display, fontWeight: typography.weight.black, letterSpacing: 2, marginBottom: spacing.xxl, fontFamily: 'Georgia' },

  /* Ville */
  cityCards:        { gap: spacing.lg },
  cityCard:         { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl - 2, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  cityCardOn:       { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cityEmojiWrap:    { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityEmojiWrapOn:  { backgroundColor: colors.accentSoft },
  cityEmoji:        { fontSize: 24 },
  cityLabel:        { color: colors.textMuted, fontSize: typography.size.heading2, fontWeight: typography.weight.regular, marginBottom: 2 },
  cityLabelOn:      { color: colors.text },
  citySub:          { color: colors.textDim, fontSize: typography.size.caption },
  cityCountBadge:   { alignItems: 'center', marginRight: spacing.md },
  cityCount:        { color: colors.textMuted, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  cityCountLbl:     { color: colors.textDim, fontSize: typography.size.xs },
  cityCheck:        { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityCheckTxt:     { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },
  cityUncheck:      { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.textDim, flexShrink: 0 },

  /* Rôle */
  roleCard:         { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxl - 2 },
  roleCardClient:   { borderColor: 'rgba(90,155,224,0.3)' },
  roleCardPro:      { borderColor: 'rgba(232,160,69,0.2)', backgroundColor: colors.accentSoft },
  roleIconWrap:     { width: 52, height: 52, borderRadius: radius.lg + 1, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleEmoji:        { fontSize: 24 },
  roleTitle:        { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.medium, marginBottom: spacing.xs },
  roleDesc:         { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 16, marginBottom: spacing.lg },
  roleChips:        { flexDirection: 'row', gap: spacing.sm },
  roleChipSmall:    { borderRadius: 100, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs },
  roleChipTxt:      { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.regular },
  roleArrowWrap:    { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleArrow:        { fontSize: 20, fontWeight: typography.weight.regular },
  roleSep:          { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginVertical: spacing.xl },
  roleSepLine:      { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  roleSepTxt:       { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },
  legal:            { color: colors.textDim, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 16, marginTop: spacing.xxl },

  /* Footer */
  footer:     { paddingHorizontal: spacing.xxl, paddingBottom: spacing.section - 4, gap: spacing.xxl - 2 },
  footerBtns: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn:    { paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  skipTxt:    { color: colors.textDim, fontSize: typography.size.subheading },
  nextBtn:    { borderRadius: radius.xl, paddingVertical: spacing.xl - 2, paddingHorizontal: spacing.xxl + 6 },
  nextBtnDim: { backgroundColor: colors.textDim },
  nextTxt:    { color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.medium },
});
