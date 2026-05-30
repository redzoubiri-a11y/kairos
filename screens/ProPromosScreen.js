import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const PROMO_TYPES = [
  { id: 'percent', icon: '%',  label: 'Réduction %',  desc: 'Ex : −20% sur l\'addition' },
  { id: 'fixed',   icon: 'DA', label: 'Montant fixe', desc: 'Ex : −500 DA offerts' },
  { id: 'free',    icon: '🎁', label: 'Offert',        desc: 'Ex : Dessert offert' },
  { id: '2for1',   icon: '2×1',label: '2 pour 1',     desc: 'Le moins cher offert' },
];
const PERCENTS = ['10%', '15%', '20%', '25%', '30%'];
const PAST_PROMOS = [
  { label: '−15% weekend',          period: '1–15 Mai',   uses: 34  },
  { label: 'Menu spécial Ramadan',  period: 'Mars–Avr.',  uses: 112 },
];

/* ── Skeleton ── */
function Skeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.lg }}>
      <MLoader width="60%" height={14} borderRadius={radius.sm} />
      <MLoader width="100%" height={80} borderRadius={radius.xl} />
      <MLoader width="40%" height={12} borderRadius={radius.sm} style={{ marginTop: spacing.md }} />
      <MLoader width="100%" height={100} borderRadius={radius.xl} />
      <MLoader width="100%" height={70}  borderRadius={radius.xl} />
    </View>
  );
}

/* ── Écran liste des promos ── */
function ListScreen({ restaurant, onCreate }) {
  const hasActive = true; // fictif — à brancher sur Supabase

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>

        {/* Bandeau promo active */}
        {hasActive && (
          <View style={s.activeBanner}>
            <Text style={{ fontSize: 22 }}>🟢</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.activeBannerTitle}>1 promo active en ce moment</Text>
              <Text style={s.activeBannerSub}>Visible par tous les clients sur ta fiche</Text>
            </View>
          </View>
        )}

        {/* Section Active */}
        <View>
          <Text style={s.sectionLabel}>⚡ Active</Text>
          <View style={s.promoCard}>
            <View style={s.promoCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.promoTitle}>−20% sur l'addition</Text>
                <Text style={s.promoSub}>Avant 21h · Tous les soirs</Text>
              </View>
              <View style={s.livePill}>
                <View style={s.liveDot} />
                <Text style={s.liveTxt}>Live</Text>
              </View>
            </View>

            <View style={s.tagRow}>
              {['📅 Lun–Ven', '🕐 18h–21h', '👥 Sans minimum'].map(t => (
                <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
              ))}
            </View>

            {/* Barre de progression */}
            <View style={s.progressBox}>
              <View style={s.progressRow}>
                <Text style={s.progressLabel}>Utilisations aujourd'hui</Text>
                <Text style={s.progressVal}>7 / 20</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: '35%' }]} />
              </View>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity style={s.editBtn}>
                <Text style={s.editBtnTxt}>✏️ Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pauseBtn}>
                <Text style={s.pauseBtnTxt}>⏸ Suspendre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section Passées */}
        <View>
          <Text style={s.sectionLabel}>📋 Passées</Text>
          {PAST_PROMOS.map((p, i) => (
            <View key={i} style={s.pastCard}>
              <View style={s.pastCardTop}>
                <Text style={s.pastTitle}>{p.label}</Text>
                <View style={s.usesPill}>
                  <Text style={s.usesTxt}>{p.uses} utilisations</Text>
                </View>
              </View>
              <Text style={s.pastPeriod}>{p.period}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

/* ── Écran création de promo ── */
function CreateScreen({ onActivate, onBack }) {
  const [type,    setType]    = useState('percent');
  const [percent, setPercent] = useState('20%');
  const [maxUses, setMaxUses] = useState('20');

  const label = type === 'percent' ? `−${percent} sur l'addition`
              : type === 'fixed'   ? '−500 DA offerts'
              : type === 'free'    ? 'Dessert offert'
              : '2 plats achetés = 1 offert';

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>

        {/* Type */}
        <View>
          <Text style={s.fieldLabel}>Type de promotion</Text>
          <View style={s.typeGrid}>
            {PROMO_TYPES.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[s.typeCard, type === t.id && s.typeCardOn]}
                onPress={() => setType(t.id)}
              >
                <Text style={[s.typeIcon, type === t.id && { color: colors.accent }]}>{t.icon}</Text>
                <Text style={[s.typeLabel, type === t.id && { color: colors.accent }]}>{t.label}</Text>
                <Text style={s.typeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pills pourcentage */}
        {type === 'percent' && (
          <View>
            <Text style={s.fieldLabel}>Pourcentage de réduction</Text>
            <View style={s.percentRow}>
              {PERCENTS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.percentPill, percent === p && s.percentPillOn]}
                  onPress={() => setPercent(p)}
                >
                  <Text style={[s.percentTxt, percent === p && s.percentTxtOn]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Période */}
        <View>
          <Text style={s.fieldLabel}>📅 Période</Text>
          <View style={s.inputBox}>
            <Text style={s.inputVal}>Lundi – Vendredi</Text>
          </View>
        </View>

        {/* Créneau */}
        <View>
          <Text style={s.fieldLabel}>Créneau horaire</Text>
          <View style={s.slotRow}>
            <View style={s.slotBox}><Text style={s.slotTxt}>18h00</Text></View>
            <Text style={s.slotArrow}>→</Text>
            <View style={s.slotBox}><Text style={s.slotTxt}>21h00</Text></View>
          </View>
        </View>

        {/* Max utilisations */}
        <View>
          <Text style={s.fieldLabel}>🔢 Nombre max d'utilisations / soir</Text>
          <View style={[s.inputBox, { flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={[s.inputVal, { flex: 1 }]}
              value={maxUses}
              onChangeText={setMaxUses}
              keyboardType="numeric"
              placeholder="Illimité si vide"
              placeholderTextColor={colors.textDim}
            />
          </View>
          <Text style={s.hint}>Laisse vide pour ne pas limiter</Text>
        </View>

        {/* Aperçu client */}
        <View style={s.preview}>
          <Text style={s.previewLabel}>👁 Aperçu client</Text>
          <Text style={s.previewTitle}>{label}</Text>
          <Text style={s.previewSub}>Lun–Ven · 18h00–21h00 · Max {maxUses || '∞'}/soir</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.activateBtn} onPress={onActivate}>
          <Text style={s.activateBtnTxt}>Activer la promotion →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

/* ── Écran confirmation activation ── */
function ActiveScreen({ onViewAll, onCreate }) {
  const recap = [
    ['Type',    '−20% sur l\'addition'],
    ['Créneau', '18h00 – 21h00'],
    ['Jours',   'Lun–Ven'],
    ['Limite',  '20 utilisations / soir'],
    ['Statut',  '● Active'],
  ];
  return (
    <ScrollView contentContainerStyle={s.activeWrap}>
      <View style={s.activeIconWrap}>
        <Text style={{ fontSize: 36 }}>🎁</Text>
      </View>
      <Text style={s.activeTitle}>Promotion activée !</Text>
      <Text style={s.activeSub}>
        Ta promo est maintenant visible par tous les clients sur ta fiche Mida.
      </Text>
      <View style={s.recapCard}>
        {recap.map(([k, v], i) => (
          <View key={k} style={[s.recapRow, i < recap.length - 1 && s.recapSep]}>
            <Text style={s.recapKey}>{k}</Text>
            <Text style={[s.recapVal, k === 'Statut' && { color: colors.green }]}>{v}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={s.activateBtn} onPress={onViewAll}>
        <Text style={s.activateBtnTxt}>Voir toutes mes promos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.ghostBtn} onPress={onCreate}>
        <Text style={s.ghostBtnTxt}>Créer une autre promo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ── Écran principal ── */
export default function ProPromosScreen({ navigation }) {
  const [view,       setView]       = useState('list'); // 'list' | 'create' | 'active'
  const [restaurant, setRestaurant] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: ownerRow } = await supabase
          .from('restaurant_owners')
          .select('restaurant_id')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        if (ownerRow?.restaurant_id) {
          const { data: resto } = await supabase
            .from('restaurants')
            .select('id, name')
            .eq('id', ownerRow.restaurant_id)
            .maybeSingle();
          if (resto) setRestaurant(resto);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []));

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {(view !== 'list') && (
            <TouchableOpacity style={s.backBtn} onPress={() => setView('list')}>
              <Text style={s.backBtnTxt}>←</Text>
            </TouchableOpacity>
          )}
          {view === 'list' && (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backBtnTxt}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={s.title}>
              {view === 'list'   ? 'Mes promotions'      :
               view === 'create' ? 'Créer une promotion' :
               'Promotion activée'}
            </Text>
            {restaurant && <Text style={s.subtitle}>{restaurant.name}</Text>}
          </View>
        </View>
        {view === 'list' && (
          <TouchableOpacity style={s.createBtn} onPress={() => setView('create')}>
            <Text style={s.createBtnTxt}>+ Créer</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? <Skeleton /> : (
        view === 'list'   ? <ListScreen   restaurant={restaurant} onCreate={() => setView('create')} /> :
        view === 'create' ? <CreateScreen onActivate={() => setView('active')} onBack={() => setView('list')} /> :
                            <ActiveScreen onViewAll={() => setView('list')} onCreate={() => setView('create')} />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },

  /* Header */
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  backBtnTxt:  { color: colors.text, fontSize: typography.size.subheading },
  title:       { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  subtitle:    { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  createBtn:   { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  createBtnTxt:{ color: colors.bg, fontSize: typography.size.caption, fontWeight: typography.weight.extrabold },

  /* Bandeau */
  activeBanner:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.greenSoft, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  activeBannerTitle: { color: colors.green, fontSize: typography.size.body, fontWeight: typography.weight.bold },
  activeBannerSub:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2 },

  /* Section label */
  sectionLabel: { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.bold, marginBottom: spacing.md },

  /* Promo card active */
  promoCard:    { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.accent },
  promoCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  promoTitle:   { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.extrabold },
  promoSub:     { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 2 },
  livePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.greenSoft, borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  liveDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  liveTxt:      { color: colors.green, fontSize: typography.size.caption, fontWeight: typography.weight.semibold },

  /* Tags */
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag:    { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  tagTxt: { color: colors.accent, fontSize: typography.size.caption },

  /* Progress */
  progressBox:   { backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { color: colors.textMuted, fontSize: typography.size.caption },
  progressVal:   { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  progressTrack: { height: 4, backgroundColor: colors.cardBorder, borderRadius: 2 },
  progressFill:  { height: 4, backgroundColor: colors.accent, borderRadius: 2 },

  /* Actions */
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  editBtn:   { flex: 1, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  editBtnTxt:{ color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  pauseBtn:  { flex: 1, backgroundColor: colors.redSoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(224,90,90,0.2)' },
  pauseBtnTxt:{ color: colors.red, fontSize: typography.size.caption, fontWeight: typography.weight.bold },

  /* Past cards */
  pastCard:    { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, opacity: 0.75 },
  pastCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  pastTitle:   { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.bold },
  pastPeriod:  { color: colors.textDim, fontSize: typography.size.caption },
  usesPill:    { backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  usesTxt:     { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.medium },

  /* Create form */
  fieldLabel: { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.md },
  typeGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeCard:   { width: '47%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1.5, borderColor: colors.cardBorder },
  typeCardOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  typeIcon:   { fontSize: typography.size.heading1, fontWeight: typography.weight.black, color: colors.textMuted, marginBottom: spacing.xs },
  typeLabel:  { color: colors.text, fontSize: typography.size.caption, fontWeight: typography.weight.bold, textAlign: 'center' },
  typeDesc:   { color: colors.textDim, fontSize: typography.size.xs, marginTop: spacing.xs, textAlign: 'center' },

  percentRow:    { flexDirection: 'row', gap: spacing.sm },
  percentPill:   { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  percentPillOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  percentTxt:    { color: colors.textMuted, fontSize: typography.size.caption },
  percentTxtOn:  { color: colors.bg, fontWeight: typography.weight.extrabold },

  inputBox: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  inputVal: { color: colors.text, fontSize: typography.size.subheading },
  hint:     { color: colors.textDim, fontSize: typography.size.xs, marginTop: spacing.xs },

  slotRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  slotBox:  { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, alignItems: 'center' },
  slotTxt:  { color: colors.text, fontSize: typography.size.subheading },
  slotArrow:{ color: colors.textDim, fontSize: typography.size.subheading },

  preview:      { backgroundColor: colors.accentSoft, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)' },
  previewLabel: { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold, marginBottom: spacing.xs },
  previewTitle: { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
  previewSub:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 3 },

  activateBtn:    { backgroundColor: colors.accent, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  activateBtnTxt: { color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.extrabold },
  ghostBtn:       { backgroundColor: 'transparent', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', borderWidth: 1.5, borderColor: colors.accent, marginTop: spacing.sm },
  ghostBtnTxt:    { color: colors.accent, fontSize: typography.size.subheading, fontWeight: typography.weight.bold },

  /* Active screen */
  activeWrap:    { alignItems: 'center', padding: spacing.xxl, gap: spacing.xl },
  activeIconWrap:{ width: 70, height: 70, borderRadius: 35, backgroundColor: colors.accentSoft, borderWidth: 2, borderColor: 'rgba(232,160,69,0.4)', alignItems: 'center', justifyContent: 'center' },
  activeTitle:   { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.black },
  activeSub:     { color: colors.textMuted, fontSize: typography.size.body, textAlign: 'center', lineHeight: 20, maxWidth: 220 },
  recapCard:     { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)', width: '100%' },
  recapRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  recapSep:      { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  recapKey:      { color: colors.textMuted, fontSize: typography.size.body },
  recapVal:      { color: colors.text, fontSize: typography.size.body, fontWeight: typography.weight.medium },
});
