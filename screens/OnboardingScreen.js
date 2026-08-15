import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useOnboarding, { SLIDES, TOTAL } from '../src/hooks/useOnboarding';
import CGUModal from '../src/components/CGUModal';

function Dots({ total, current, accentColor }) {
  return (
    <View style={d.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            d.dot,
            i === current
              ? { backgroundColor: accentColor || colors.primary, width: 22 }
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
  dot: { height: 6, borderRadius: radius.pill },
});

export default function OnboardingScreen({ onSelect, onGuest }) {
  const [showCGU, setShowCGU] = useState(false);
  const {
    step,
    fadeAnim, slideAnim, scaleAnim,
    goToFinal, goToNext, goClient, goPro, goGuest,
  } = useOnboarding({ onSelect, onGuest });

  if (step <= 2) {
    const sl = SLIDES[step];
    return (
      <SafeAreaView style={s.root}>
        <TouchableOpacity style={s.skipPill} onPress={goToFinal} activeOpacity={0.75}>
          <Text style={s.skipPillTxt}>Passer</Text>
        </TouchableOpacity>

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
          <Dots total={TOTAL} current={step} accentColor={colors.primary} />
          <TouchableOpacity style={s.nextBtn} onPress={goToNext} activeOpacity={0.85}>
            <Text style={s.nextTxt}>{step === 2 ? 'Commencer  ✦' : 'Suivant  →'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <Animated.View style={[s.stepWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <View style={s.stepHeader}>
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
          <View style={[s.roleIconWrap, { backgroundColor: colors.goldSoft, borderColor: 'rgba(200,151,90,0.3)' }]}>
            <Text style={s.roleEmoji}>📊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.roleTitle, { color: colors.gold }]}>J'ai un restaurant</Text>
            <Text style={s.roleDesc}>Gérer mes réservations et ma visibilité sur Mida</Text>
            <View style={s.roleChips}>
              {['Dashboard', 'Comptoir'].map((t, i) => (
                <View key={i} style={[s.roleChipSmall, { borderColor: 'rgba(200,151,90,0.3)', backgroundColor: colors.goldSoft }]}>
                  <Text style={[s.roleChipTxt, { color: colors.gold }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[s.roleArrowWrap, { backgroundColor: colors.goldSoft }]}>
            <Text style={[s.roleArrow, { color: colors.gold }]}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={s.legal}>
          En continuant, vous acceptez nos{' '}
          <Text style={s.legalLink} onPress={() => setShowCGU(true)}>conditions d'utilisation</Text>
          {'\n'}et notre{' '}
          <Text style={s.legalLink} onPress={() => Linking.openURL('https://mida-food.com/confidentialite')}>politique de confidentialité</Text>.
        </Text>
        <CGUModal visible={showCGU} onClose={() => setShowCGU(false)} />

        <TouchableOpacity style={s.guestBtn} onPress={goGuest} activeOpacity={0.6}>
          <Text style={s.guestTxt}>Explorer sans compte →</Text>
        </TouchableOpacity>

      </Animated.View>

      <View style={[s.footer, { paddingBottom: spacing.lg }]}>
        <Dots total={TOTAL} current={3} accentColor={colors.primary} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  skipPill:    { position: 'absolute', top: spacing.xl, right: 20, zIndex: 10, backgroundColor: 'rgba(10,10,10,0.4)', borderRadius: radius.badgeSm, paddingHorizontal: 13, paddingVertical: spacing.sm },
  skipPillTxt: { fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg - 0.5, color: '#FFFFFF' },

  slideWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  tag:        { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginBottom: spacing.section },
  tagDot:     { width: 5, height: 5, borderRadius: 2.5 },
  tagTxt:     { fontSize: typography.size.xs, letterSpacing: 3, fontWeight: typography.weight.semibold },
  emojiOuter: { width: 148, height: 148, borderRadius: 74, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.section + 4 },
  emojiInner: { width: 108, height: 108, borderRadius: 54, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mainEmoji:  { fontSize: 56 },
  slideTitle: { color: colors.text, fontFamily: typography.display, fontSize: typography.size.hero, fontWeight: typography.weight.bold, letterSpacing: -0.5, textAlign: 'center', lineHeight: 36, marginBottom: spacing.xl },
  slideSub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xxl + 4, paddingHorizontal: spacing.md },
  chipsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  chip:       { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  chipTxt:    { fontSize: typography.size.caption, fontWeight: typography.weight.regular },

  stepWrap:   { flex: 1, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  stepHeader: { alignItems: 'center', marginBottom: spacing.section },
  stepTag:    { color: colors.primary, fontSize: typography.size.xs, letterSpacing: 3, fontWeight: typography.weight.semibold, marginBottom: spacing.lg },
  stepTitle:  { color: colors.text, fontFamily: typography.display, fontSize: typography.size.hero, fontWeight: typography.weight.bold, letterSpacing: -0.5, marginBottom: spacing.md, textAlign: 'center' },
  stepSub:    { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },

  cityCards:       { gap: spacing.lg },
  cityCard:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl - 2, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl },
  cityCardOn:      { borderColor: '#c8975a', backgroundColor: 'rgba(200,151,90,0.12)', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  cityEmojiWrap:   { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityEmojiWrapOn: { backgroundColor: colors.accentSoft },
  cityEmoji:       { fontSize: 24 },
  cityLabel:       { color: colors.textMuted, fontSize: typography.size.heading2, fontWeight: typography.weight.regular, marginBottom: 2 },
  cityLabelOn:     { color: colors.text },
  citySub:         { color: colors.textDim, fontSize: typography.size.caption },
  cityCountBadge:  { alignItems: 'center', marginRight: spacing.md },
  cityCount:       { color: colors.textMuted, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  cityCountLbl:    { color: colors.textDim, fontSize: typography.size.xs },
  cityCheck:       { width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityCheckTxt:    { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },
  cityUncheck:     { width: 26, height: 26, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.textDim, flexShrink: 0 },

  roleCard:      { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxl - 2 },
  roleCardClient:{ borderColor: 'rgba(90,155,224,0.3)' },
  roleCardPro:   { borderColor: 'rgba(200,151,90,0.4)', backgroundColor: 'rgba(200,151,90,0.12)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  roleIconWrap:  { width: 52, height: 52, borderRadius: radius.lg + 1, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleEmoji:     { fontSize: 24 },
  roleTitle:     { color: colors.text, fontSize: typography.size.heading3, fontWeight: typography.weight.medium, marginBottom: spacing.xs },
  roleDesc:      { color: colors.textMuted, fontSize: typography.size.caption, lineHeight: 16, marginBottom: spacing.lg },
  roleChips:     { flexDirection: 'row', gap: spacing.sm },
  roleChipSmall: { borderRadius: radius.sm + 2, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.cardBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.xxs },
  roleChipTxt:   { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.regular },
  roleArrowWrap: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleArrow:     { fontSize: 20, fontWeight: typography.weight.regular },
  roleSep:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginVertical: spacing.xl },
  roleSepLine:   { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  roleSepTxt:    { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },
  legal:         { color: colors.textDim, fontSize: typography.size.sm, textAlign: 'center', lineHeight: 16, marginTop: spacing.xxl },
  legalLink:     { color: colors.textMuted, textDecorationLine: 'underline' },
  guestBtn:      { alignSelf: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.lg },
  guestTxt:      { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },

  footer:     { paddingHorizontal: spacing.xxl, paddingBottom: spacing.section - 4, gap: spacing.xxl - 2 },
  nextBtn:    { backgroundColor: colors.noir, borderRadius: radius.xl, alignItems: 'center', paddingVertical: spacing.xl - 2 },
  nextTxt:    { color: '#FFFFFF', fontSize: typography.size.subheading, fontWeight: typography.weight.bold },
});
