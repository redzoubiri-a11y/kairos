import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Dimensions, Animated,
} from 'react-native';

const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;

const C = {
  bg: '#080d18', bg2: '#0f1828', bg3: '#162035',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#3a4a5e',
  green: '#3d9970',
  border: 'rgba(255,255,255,0.07)',
};

const SLIDES = [
  {
    emoji: '🏆',
    bg: '#070e1a',
    ringBg: 'rgba(61,153,112,0.1)',
    ringBorder: 'rgba(61,153,112,0.25)',
    accent: '#3d9970',
    tag: 'BIENVENUE SUR MIDA',
    title: 'La meilleure\ntable vous attend',
    sub: 'Les restaurants d\'exception d\'Alger, Oran et Constantine sélectionnés pour vous.',
    chips: ['35+ restaurants', 'Meilleure sélection', 'Toutes cuisines'],
  },
  {
    emoji: '🗺️',
    bg: '#070c18',
    ringBg: 'rgba(74,127,165,0.1)',
    ringBorder: 'rgba(74,127,165,0.25)',
    accent: '#4a7fa5',
    tag: 'EXPLOREZ LA VILLE',
    title: 'Trouvez\nla table idéale',
    sub: 'Carte interactive, filtres par quartier, cuisine et budget. L\'adresse parfaite en quelques secondes.',
    chips: ['Vue carte & liste', 'Filtres avancés', 'Avis vérifiés'],
  },
  {
    emoji: '📅',
    bg: '#0d0a05',
    ringBg: 'rgba(200,151,90,0.1)',
    ringBorder: 'rgba(200,151,90,0.25)',
    accent: '#c8975a',
    tag: 'RÉSERVATION INSTANTANÉE',
    title: 'Réservez\nen 30 secondes',
    sub: 'Date, heure, couverts. Confirmation directe par le restaurant, rappel automatique.',
    chips: ['Zéro appel', 'Confirmation rapide', 'Annulation libre'],
  },
];

const CITIES = [
  { id: 'alger',       label: 'Alger',       emoji: '🏛️', sub: 'Capitale',        count: '20+' },
  { id: 'oran',        label: 'Oran',         emoji: '🌊', sub: 'Ville du Ponant',  count: '10+' },
  { id: 'constantine', label: 'Constantine',  emoji: '🌉', sub: 'Cité des Ponts',   count: '5+'  },
];

/* ─── Dots animés ─── */
function Dots({ total, current, accentColor }) {
  return (
    <View style={d.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            d.dot,
            i === current
              ? { backgroundColor: accentColor || C.accent, width: 22 }
              : { backgroundColor: C.dimmer, width: 6 },
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

  function goTo(next) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(24);
      scaleAnim.setValue(0.78);
      // setTimeout(0) laisse React committer le nouveau rendu avant de lancer
      // l'animation sur les nouveaux noeuds natifs — évite l'écran noir bloqué
      setTimeout(() => {
        fadeAnim.setValue(0);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();
      }, 0);
    });
  }

  useEffect(() => {
    scaleAnim.setValue(0.78);
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  /* ── Slides intro (0-2) ── */
  if (step <= 2) {
    const sl = SLIDES[step];
    return (
      <SafeAreaView style={[s.root, { backgroundColor: sl.bg }]}>
        <Animated.View style={[s.slideWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Tag */}
          <View style={[s.tag, { borderColor: sl.accent + '40', backgroundColor: sl.accent + '14' }]}>
            <View style={[s.tagDot, { backgroundColor: sl.accent }]} />
            <Text style={[s.tagTxt, { color: sl.accent }]}>{sl.tag}</Text>
          </View>

          {/* Icône animée */}
          <Animated.View style={[s.emojiOuter, { borderColor: sl.ringBorder, backgroundColor: sl.ringBg, transform: [{ scale: scaleAnim }] }]}>
            <View style={[s.emojiInner, { backgroundColor: sl.accent + '18', borderColor: sl.accent + '30' }]}>
              <Text style={s.mainEmoji}>{sl.emoji}</Text>
            </View>
          </Animated.View>

          {/* Texte */}
          <Text style={s.slideTitle}>{sl.title}</Text>
          <Text style={s.slideSub}>{sl.sub}</Text>

          {/* Chips features */}
          <View style={s.chipsRow}>
            {sl.chips.map((c, i) => (
              <View key={i} style={[s.chip, { borderColor: sl.accent + '35', backgroundColor: sl.accent + '10' }]}>
                <Text style={[s.chipTxt, { color: sl.accent }]}>{c}</Text>
              </View>
            ))}
          </View>

        </Animated.View>

        {/* Footer */}
        <View style={s.footer}>
          <Dots total={TOTAL} current={step} accentColor={sl.accent} />
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.skipBtn} onPress={() => goTo(4)} activeOpacity={0.6}>
              <Text style={s.skipTxt}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.nextBtn, { backgroundColor: sl.accent }]} onPress={() => goTo(step + 1)} activeOpacity={0.85}>
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
                  <Text style={[s.cityCount, city === c.id && { color: C.accent }]}>{c.count}</Text>
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
          <Dots total={TOTAL} current={3} accentColor={C.accent} />
          <View style={s.footerBtns}>
            <TouchableOpacity style={s.skipBtn} onPress={() => goTo(4)} activeOpacity={0.6}>
              <Text style={s.skipTxt}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.nextBtn, !city && s.nextBtnDim]}
              onPress={() => city && goTo(4)}
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
          <Text style={s.logoMain}>MIDA</Text>
          <Text style={s.stepTitle}>Vous êtes…</Text>
          <Text style={s.stepSub}>Choisissez votre profil pour commencer.</Text>
        </View>

        {/* Carte client */}
        <TouchableOpacity style={s.roleCard} onPress={() => onSelect('client')} activeOpacity={0.82}>
          <View style={[s.roleIconWrap, { backgroundColor: 'rgba(74,127,165,0.15)', borderColor: 'rgba(74,127,165,0.3)' }]}>
            <Text style={s.roleEmoji}>🍽️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.roleTitle}>Je cherche une table</Text>
            <Text style={s.roleDesc}>Découvrir, réserver et savourer les meilleures adresses</Text>
            <View style={s.roleChips}>
              <View style={s.roleChipSmall}><Text style={s.roleChipTxt}>Explorer</Text></View>
              <View style={s.roleChipSmall}><Text style={s.roleChipTxt}>Réserver</Text></View>
              <View style={s.roleChipSmall}><Text style={s.roleChipTxt}>Favoris</Text></View>
            </View>
          </View>
          <View style={[s.roleArrowWrap, { backgroundColor: 'rgba(74,127,165,0.15)' }]}>
            <Text style={[s.roleArrow, { color: C.accent2 }]}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Séparateur */}
        <View style={s.roleSep}>
          <View style={s.roleSepLine} />
          <Text style={s.roleSepTxt}>OU</Text>
          <View style={s.roleSepLine} />
        </View>

        {/* Carte pro */}
        <TouchableOpacity style={[s.roleCard, s.roleCardPro]} onPress={() => onSelect('pro')} activeOpacity={0.82}>
          <View style={[s.roleIconWrap, { backgroundColor: 'rgba(200,151,90,0.15)', borderColor: 'rgba(200,151,90,0.3)' }]}>
            <Text style={s.roleEmoji}>📊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.roleTitle, { color: C.accent }]}>J'ai un restaurant</Text>
            <Text style={s.roleDesc}>Gérer mes réservations et ma visibilité sur MIDA</Text>
            <View style={s.roleChips}>
              <View style={[s.roleChipSmall, { borderColor: 'rgba(200,151,90,0.3)', backgroundColor: 'rgba(200,151,90,0.08)' }]}>
                <Text style={[s.roleChipTxt, { color: C.accent }]}>Dashboard</Text>
              </View>
              <View style={[s.roleChipSmall, { borderColor: 'rgba(200,151,90,0.3)', backgroundColor: 'rgba(200,151,90,0.08)' }]}>
                <Text style={[s.roleChipTxt, { color: C.accent }]}>Comptoir</Text>
              </View>
            </View>
          </View>
          <View style={[s.roleArrowWrap, { backgroundColor: 'rgba(200,151,90,0.12)' }]}>
            <Text style={[s.roleArrow, { color: C.accent }]}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={s.legal}>En continuant, vous acceptez nos conditions{'\n'}d'utilisation et notre politique de confidentialité.</Text>

      </Animated.View>

      <View style={[s.footer, { paddingBottom: 12 }]}>
        <Dots total={TOTAL} current={4} accentColor={C.accent} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* ── Slide intro ── */
  slideWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  tag:         { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 100, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 32 },
  tagDot:      { width: 5, height: 5, borderRadius: 3 },
  tagTxt:      { fontSize: 9, letterSpacing: 3, fontWeight: '600' },

  emojiOuter:  { width: 148, height: 148, borderRadius: 40, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  emojiInner:  { width: 108, height: 108, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mainEmoji:   { fontSize: 56 },

  slideTitle:  { color: C.text, fontSize: 32, fontWeight: '200', letterSpacing: 0.3, textAlign: 'center', lineHeight: 40, marginBottom: 14 },
  slideSub:    { color: C.dim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },

  chipsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip:        { borderRadius: 100, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  chipTxt:     { fontSize: 11, fontWeight: '400' },

  /* ── Étapes ── */
  stepWrap:    { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  stepHeader:  { alignItems: 'center', marginBottom: 32 },
  stepTag:     { color: C.accent, fontSize: 9, letterSpacing: 3, fontWeight: '600', marginBottom: 12 },
  stepTitle:   { color: C.text, fontSize: 28, fontWeight: '200', letterSpacing: 0.3, marginBottom: 10, textAlign: 'center' },
  stepSub:     { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  logoMain:    { color: C.accent, fontSize: 26, fontWeight: '300', letterSpacing: 10, marginBottom: 18 },

  /* ── Ville ── */
  cityCards:   { gap: 12 },
  cityCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.bg2, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  cityCardOn:  { borderColor: C.accent, backgroundColor: 'rgba(200,151,90,0.06)' },
  cityEmojiWrap:   { width: 48, height: 48, borderRadius: 14, backgroundColor: C.bg3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityEmojiWrapOn: { backgroundColor: 'rgba(200,151,90,0.14)' },
  cityEmoji:   { fontSize: 24 },
  cityLabel:   { color: C.dim, fontSize: 17, fontWeight: '300', marginBottom: 2 },
  cityLabelOn: { color: C.text },
  citySub:     { color: C.dimmer, fontSize: 11 },
  cityCountBadge:{ alignItems: 'center', marginRight: 8 },
  cityCount:   { color: C.dim, fontSize: 18, fontWeight: '200' },
  cityCountLbl:{ color: C.dimmer, fontSize: 9 },
  cityCheck:   { width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityCheckTxt:{ color: C.bg, fontSize: 13, fontWeight: '700' },
  cityUncheck: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.dimmer, flexShrink: 0 },

  /* ── Rôle ── */
  roleCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.bg2, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18 },
  roleCardPro: { borderColor: 'rgba(200,151,90,0.2)', backgroundColor: 'rgba(200,151,90,0.04)' },
  roleIconWrap:    { width: 52, height: 52, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleEmoji:   { fontSize: 24 },
  roleTitle:   { color: C.text, fontSize: 15, fontWeight: '400', marginBottom: 4 },
  roleDesc:    { color: C.dim, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  roleChips:   { flexDirection: 'row', gap: 6 },
  roleChipSmall:   { borderRadius: 100, borderWidth: 1, borderColor: 'rgba(138,154,176,0.25)', backgroundColor: 'rgba(138,154,176,0.08)', paddingHorizontal: 8, paddingVertical: 3 },
  roleChipTxt: { color: C.dim, fontSize: 9, fontWeight: '400' },
  roleArrowWrap:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleArrow:   { fontSize: 20, fontWeight: '300' },
  roleSep:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  roleSepLine: { flex: 1, height: 1, backgroundColor: C.border },
  roleSepTxt:  { color: C.dimmer, fontSize: 10, letterSpacing: 2 },
  legal:       { color: C.dimmer, fontSize: 10, textAlign: 'center', lineHeight: 16, marginTop: 24 },

  /* ── Footer ── */
  footer:      { paddingHorizontal: 24, paddingBottom: 28, gap: 18 },
  footerBtns:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn:     { paddingVertical: 10, paddingHorizontal: 4 },
  skipTxt:     { color: C.dimmer, fontSize: 14 },
  nextBtn:     { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 26, backgroundColor: C.accent },
  nextBtnDim:  { backgroundColor: C.dimmer },
  nextTxt:     { color: C.bg, fontSize: 14, fontWeight: '500' },
});
