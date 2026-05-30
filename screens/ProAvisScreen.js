import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform,
  RefreshControl,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';

const STARS = [1, 2, 3, 4, 5];
const FILTERS = ['Tous', '5 ⭐', '4 ⭐', '3 ⭐', '1–2 ⭐', 'Sans réponse'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

const AVATAR_COLORS = [colors.accent, colors.blue, colors.green, colors.purple || '#9B5AE0', colors.accentDim || colors.accent];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <View style={{ padding: spacing.xl, gap: spacing.lg }}>
      <MLoader width="100%" height={100} borderRadius={radius.xl} />
      <MLoader width="60%" height={12}  borderRadius={radius.sm} />
      {[1, 2, 3].map(i => (
        <MLoader key={i} width="100%" height={110} borderRadius={radius.xl} />
      ))}
    </View>
  );
}

/* ── Bloc statistiques ── */
function StatsBlock({ reviews }) {
  if (!reviews.length) return null;
  const avg   = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist  = STARS.map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length })).reverse();
  const max   = Math.max(...dist.map(d => d.count), 1);
  const responded = reviews.filter(r => r.pro_response).length;

  return (
    <View style={st.wrap}>
      {/* Note globale */}
      <View style={st.scoreRow}>
        <View style={st.scoreLeft}>
          <Text style={st.scoreNum}>{avg.toFixed(1)}</Text>
          <Text style={st.scoreStar}>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5 - Math.round(avg))}</Text>
          <Text style={st.scoreCount}>{reviews.length} avis certifiés</Text>
        </View>
        <View style={st.barBlock}>
          {dist.map(d => (
            <View key={d.star} style={st.barRow}>
              <Text style={st.barLabel}>{d.star}★</Text>
              <View style={st.barTrack}>
                <View style={[st.barFill, {
                  width: `${Math.round((d.count / max) * 100)}%`,
                  backgroundColor: d.star >= 4 ? colors.green : d.star === 3 ? colors.accent : colors.red,
                }]} />
              </View>
              <Text style={st.barCount}>{d.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Taux de réponse */}
      <View style={st.responseRow}>
        <View style={{ flex: 1 }}>
          <Text style={st.responseLabel}>Taux de réponse</Text>
          <View style={st.responseTrack}>
            <View style={[st.responseFill, { width: `${Math.round((responded / reviews.length) * 100)}%` }]} />
          </View>
        </View>
        <Text style={st.responseVal}>{Math.round((responded / reviews.length) * 100)}%</Text>
      </View>
      {responded < reviews.length && (
        <Text style={st.responseTip}>💡 {reviews.length - responded} avis sans réponse — réponds pour booster ta visibilité</Text>
      )}
    </View>
  );
}
const st = StyleSheet.create({
  wrap:          { marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xl, gap: spacing.lg },
  scoreRow:      { flexDirection: 'row', gap: spacing.xl },
  scoreLeft:     { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, minWidth: 70 },
  scoreNum:      { color: colors.text, fontSize: 36, fontWeight: '200', lineHeight: 38 },
  scoreStar:     { color: colors.accent, fontSize: typography.size.body, letterSpacing: 1 },
  scoreCount:    { color: colors.textDim, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.xxs },
  barBlock:      { flex: 1, gap: spacing.xs },
  barRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel:      { color: colors.textDim, fontSize: typography.size.xs, width: 22, textAlign: 'right' },
  barTrack:      { flex: 1, height: 6, backgroundColor: colors.cardHover || colors.bg, borderRadius: 3 },
  barFill:       { height: 6, borderRadius: 3, minWidth: 2 },
  barCount:      { color: colors.textMuted, fontSize: typography.size.xs, width: 16 },
  responseRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  responseLabel: { color: colors.textMuted, fontSize: typography.size.caption, marginBottom: spacing.xs },
  responseTrack: { height: 5, backgroundColor: colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  responseFill:  { height: 5, backgroundColor: colors.green, borderRadius: 3 },
  responseVal:   { color: colors.green, fontSize: typography.size.subheading, fontWeight: typography.weight.medium, minWidth: 36, textAlign: 'right' },
  responseTip:   { color: colors.accent, fontSize: typography.size.caption },
});

/* ── Carte avis ── */
function ReviewCard({ review, onSaveResponse }) {
  const [replying, setReplying] = useState(false);
  const [text,     setText]     = useState(review.pro_response || '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(!!review.pro_response);

  const name = [review.users?.first_name, review.users?.last_name].filter(Boolean).join(' ') || 'Client';
  const col  = avatarColor(name);
  const ini  = initials(review.users?.first_name, review.users?.last_name);
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const ratingColor = review.rating >= 4 ? colors.green : review.rating === 3 ? colors.accent : colors.red;

  const save = useCallback(async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await supabase.from('reviews').update({ pro_response: text.trim() }).eq('id', review.id);
      setSaved(true);
      setReplying(false);
      onSaveResponse?.(review.id, text.trim());
    } finally {
      setSaving(false);
    }
  }, [text, review.id, onSaveResponse]);

  return (
    <View style={rv.card}>
      {/* Top row */}
      <View style={rv.top}>
        <View style={[rv.avatar, { backgroundColor: col + '22', borderColor: col + '55' }]}>
          <Text style={[rv.avatarTxt, { color: col }]}>{ini}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rv.name}>{name}</Text>
          <Text style={rv.date}>{formatDate(review.created_at)}</Text>
        </View>
        <View style={rv.ratingWrap}>
          <Text style={[rv.stars, { color: ratingColor }]}>{stars}</Text>
        </View>
      </View>

      {/* Commentaire */}
      {!!review.comment && (
        <Text style={rv.comment}>"{review.comment}"</Text>
      )}

      {/* Réponse existante */}
      {saved && !replying && (
        <View style={rv.responseWrap}>
          <View style={rv.responseHeader}>
            <Text style={rv.responseIcon}>🏪</Text>
            <Text style={rv.responseLabel}>Votre réponse</Text>
            <TouchableOpacity onPress={() => setReplying(true)}>
              <Text style={rv.editTxt}>Modifier</Text>
            </TouchableOpacity>
          </View>
          <Text style={rv.responseTxt}>{text}</Text>
        </View>
      )}

      {/* Zone de réponse */}
      {replying ? (
        <View style={rv.replyBox}>
          <TextInput
            style={rv.replyInput}
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Répondre à cet avis…"
            placeholderTextColor={colors.textDim}
            autoFocus
          />
          <View style={rv.replyActions}>
            <TouchableOpacity style={rv.cancelBtn} onPress={() => { setReplying(false); setText(review.pro_response || ''); }}>
              <Text style={rv.cancelTxt}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rv.saveBtn} onPress={save} disabled={saving}>
              <Text style={rv.saveTxt}>{saving ? '···' : 'Publier'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !saved && (
        <TouchableOpacity style={rv.replyBtn} onPress={() => setReplying(true)}>
          <Text style={rv.replyBtnTxt}>💬  Répondre à cet avis</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const rv = StyleSheet.create({
  card:          { backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, marginHorizontal: spacing.xl, marginBottom: spacing.lg, padding: spacing.xl, gap: spacing.lg },
  top:           { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar:        { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: typography.size.bodyLg || 15, fontWeight: typography.weight.medium },
  name:          { color: colors.text, fontSize: typography.size.subheading, fontWeight: '300' },
  date:          { color: colors.textDim, fontSize: typography.size.caption, marginTop: spacing.xxs },
  ratingWrap:    {},
  stars:         { fontSize: typography.size.bodyLg || 15, letterSpacing: 1 },
  comment:       { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 20, fontStyle: 'italic' },
  responseWrap:  { backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.accent },
  responseHeader:{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  responseIcon:  { fontSize: 13 },
  responseLabel: { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.bold, flex: 1 },
  editTxt:       { color: colors.textDim, fontSize: typography.size.xs },
  responseTxt:   { color: colors.textMuted, fontSize: typography.size.body, lineHeight: 18 },
  replyBtn:      { backgroundColor: colors.accentSoft, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(232,160,69,0.25)' },
  replyBtnTxt:   { color: colors.accent, fontSize: typography.size.body },
  replyBox:      { gap: spacing.md },
  replyInput:    { backgroundColor: colors.bg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, color: colors.text, fontSize: typography.size.body, minHeight: 90, textAlignVertical: 'top' },
  replyActions:  { flexDirection: 'row', gap: spacing.md },
  cancelBtn:     { flex: 1, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  cancelTxt:     { color: colors.textMuted, fontSize: typography.size.body },
  saveBtn:       { flex: 2, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', backgroundColor: colors.accent },
  saveTxt:       { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
});

/* ── Écran principal ── */
export default function ProAvisScreen({ navigation }) {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('Tous');
  const [restaurant, setRestaurant] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!ownerRow?.restaurant_id) return;

      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', ownerRow.restaurant_id)
        .maybeSingle();
      if (resto) setRestaurant(resto);

      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, pro_response, users(first_name, last_name)')
        .eq('restaurant_id', ownerRow.restaurant_id)
        .order('created_at', { ascending: false });

      setReviews(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSaveResponse = useCallback((id, text) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, pro_response: text } : r));
  }, []);

  const noReply = useMemo(() => reviews.filter(r => !r.pro_response).length, [reviews]);

  const ratingCounts = useMemo(() => ({
    5:   reviews.filter(r => r.rating === 5).length,
    4:   reviews.filter(r => r.rating === 4).length,
    3:   reviews.filter(r => r.rating === 3).length,
    low: reviews.filter(r => r.rating <= 2).length,
  }), [reviews]);

  const filtered = useMemo(() => reviews.filter(r => {
    if (filter === 'Tous')         return true;
    if (filter === '5 ⭐')         return r.rating === 5;
    if (filter === '4 ⭐')         return r.rating === 4;
    if (filter === '3 ⭐')         return r.rating === 3;
    if (filter === '1–2 ⭐')       return r.rating <= 2;
    if (filter === 'Sans réponse') return !r.pro_response;
    return true;
  }), [reviews, filter]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Avis clients</Text>
          {restaurant && <Text style={s.subtitle}>{restaurant.name}</Text>}
        </View>
        {noReply > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{noReply}</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? <Skeleton /> : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
          >
            {/* Stats */}
            <View style={{ marginTop: spacing.xl }}>
              <StatsBlock reviews={reviews} />
            </View>

            {/* Filtre */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
              {FILTERS.map(f => {
                const isActive = filter === f;
                const count = f === 'Sans réponse' ? noReply
                            : f === 'Tous'          ? reviews.length
                            : f === '5 ⭐'          ? ratingCounts[5]
                            : f === '4 ⭐'          ? ratingCounts[4]
                            : f === '3 ⭐'          ? ratingCounts[3]
                            : ratingCounts.low;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[s.chip, isActive && s.chipOn, f === 'Sans réponse' && noReply > 0 && !isActive && s.chipAlert]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[s.chipTxt, isActive && s.chipTxtOn]}>{f}</Text>
                    {count > 0 && <Text style={[s.chipCount, isActive && s.chipCountOn]}>{count}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Compteur */}
            <View style={s.listHead}>
              <Text style={s.listHeadTxt}>{filtered.length} avis</Text>
            </View>

            {/* Liste */}
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>⭐</Text>
                <Text style={s.emptyTitle}>Aucun avis</Text>
                <Text style={s.emptyDesc}>
                  {reviews.length === 0
                    ? 'Les avis apparaîtront ici après les premières réservations.'
                    : 'Aucun avis ne correspond à ce filtre.'}
                </Text>
              </View>
            ) : (
              filtered.map(r => (
                <ReviewCard key={r.id} review={r} onSaveResponse={handleSaveResponse} />
              ))
            )}

            <View style={{ height: 48 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },

  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  backBtnTxt: { color: colors.text, fontSize: typography.size.subheading },
  title:      { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },
  subtitle:   { color: colors.textMuted, fontSize: typography.size.caption, marginTop: 1 },
  badge:      { backgroundColor: colors.red, borderRadius: radius.full, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  badgeTxt:   { color: colors.text, fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  filterRow:  { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipOn:     { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipAlert:  { borderColor: 'rgba(224,90,90,0.4)' },
  chipTxt:    { color: colors.textMuted, fontSize: typography.size.body },
  chipTxtOn:  { color: colors.accent },
  chipCount:  { color: colors.textDim, fontSize: typography.size.xs },
  chipCountOn:{ color: colors.accent },

  listHead:    { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  listHeadTxt: { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },

  empty:      { alignItems: 'center', paddingVertical: 64, gap: spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: colors.textMuted, fontSize: typography.size.subheading, fontWeight: '300' },
  emptyDesc:  { color: colors.textDim, fontSize: typography.size.body, textAlign: 'center', maxWidth: 260 },
});
