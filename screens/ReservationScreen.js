import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useReservations, { daysUntil } from '../src/hooks/useReservations';
import NextResaCard from '../src/components/NextResaCard';
import SmallResaCard from '../src/components/SmallResaCard';
import HistResaCard from '../src/components/HistResaCard';
import MidaLogo from '../src/components/MidaLogo';
import ReviewModal from '../src/components/ReviewModal';

function SkeletonView() {
  return (
    <View>
      <View style={{ marginHorizontal: spacing.xl, marginTop: spacing.xl, gap: spacing.lg }}>
        <MLoader width="100%" height={200} borderRadius={radius.pill} />
        <MLoader width="100%" height={60} borderRadius={radius.lg} />
        <MLoader width="100%" height={72} borderRadius={radius.xl} />
      </View>
      <View style={{ marginHorizontal: spacing.xl, marginTop: spacing.xxl, gap: spacing.md }}>
        <MLoader width="40%" height={9} borderRadius={radius.sm} />
        {[1, 2].map(i => (
          <MLoader key={i} width="100%" height={84} borderRadius={radius.xxl} />
        ))}
      </View>
    </View>
  );
}

export default function ReservationScreen({ navigation }) {
  const {
    tab, setTab, loading, refreshing,
    today, aVenir, historique, next, later, pending, histByMonth,
    reviewedIds,
    cancelResa, submitReview, onRefresh,
  } = useReservations();

  const [reviewTarget, setReviewTarget] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  const openReview  = useCallback((r) => setReviewTarget(r), []);
  const closeReview = useCallback(() => setReviewTarget(null), []);

  const handleSubmitReview = useCallback(async (resa, rating, comment) => {
    setSubmitting(true);
    try {
      await submitReview(resa, rating, comment);
      setReviewTarget(null);
    } catch (e) {
      // error stays visible in modal via thrown error — re-throw so modal can catch
    } finally {
      setSubmitting(false);
    }
  }, [submitReview]);

  const goExplorer   = useCallback(() => navigation?.navigate('Explorer'), [navigation]);
  const onCancelNext = useCallback(() => next && cancelResa(next), [cancelResa, next]);
  const onViewNext   = useCallback(
    () => next?.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: next.restaurants }),
    [navigation, next],
  );
  const onEditResa   = useCallback(
    (r) => r?.restaurants?.id && navigation?.navigate('ReservationForm', { restaurant: r.restaurants, reservation: r }),
    [navigation],
  );

  if (loading) return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <MLoader width={100} height={9} borderRadius={radius.sm} />
          <MLoader width={200} height={20} borderRadius={radius.sm} />
        </View>
      </View>
      <SkeletonView />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>

      <View style={s.header}>
        <View style={{ flex:1 }}>
          <MidaLogo showTagline={false} style={{ alignItems: 'flex-start', marginBottom: spacing.xs }} />
          <Text style={s.headerSub}>MES RÉSERVATIONS</Text>
          <Text style={s.headerTitle}>
            {aVenir.length > 0
              ? next
                ? (next.date === today
                    ? `Ce soir chez ${next.restaurants?.name || '…'}`
                    : `Prochaine table ${daysUntil(next.date).toLowerCase()}`)
                : 'À venir'
              : 'Aucune réservation'
            }
          </Text>
        </View>
        {pending > 0 && (
          <View style={s.pendingPill}>
            <View style={s.pendingDot} />
            <Text style={s.pendingTxt}>{pending} en attente</Text>
          </View>
        )}
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'avenir' && s.tabOn]} onPress={() => setTab('avenir')}>
          <Text style={[s.tabTxt, tab === 'avenir' && s.tabTxtOn]}>À venir</Text>
          {aVenir.length > 0 && (
            <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{aVenir.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'historique' && s.tabOn]} onPress={() => setTab('historique')}>
          <Text style={[s.tabTxt, tab === 'historique' && s.tabTxtOn]}>Historique</Text>
          {historique.length > 0 && (
            <View style={[s.tabBadge, { backgroundColor: colors.cardHover }]}>
              <Text style={[s.tabBadgeTxt, { color: colors.textDim }]}>{historique.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex:1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {tab === 'avenir' && (
          !next ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTitle}>Aucune réservation à venir</Text>
              <Text style={s.emptySub}>Explorez les restaurants et réservez votre prochaine table.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={goExplorer}>
                <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.sectionLbl}>PROCHAINE TABLE</Text>
              <NextResaCard
                r={next}
                onCancel={onCancelNext}
                onViewRestaurant={next?.restaurants?.id ? onViewNext : null}
                onEdit={() => onEditResa(next)}
              />

              {later.length > 0 && (
                <>
                  <Text style={[s.sectionLbl, { marginTop: spacing.xxl }]}>
                    PLUS TARD  ·  {later.length}
                  </Text>
                  {later.map(r => (
                    <SmallResaCard
                      key={r.id}
                      r={r}
                      onCancel={() => cancelResa(r)}
                      onPress={() => r.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: r.restaurants })}
                      onEdit={() => onEditResa(r)}
                    />
                  ))}
                </>
              )}
            </>
          )
        )}

        {tab === 'historique' && (
          historique.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🕰️</Text>
              <Text style={s.emptyTitle}>Aucun historique</Text>
              <Text style={s.emptySub}>Vos réservations passées apparaîtront ici.</Text>
            </View>
          ) : (
            Object.entries(histByMonth).map(([month, items]) => (
              <View key={month}>
                <Text style={s.monthLbl}>{month.toUpperCase()}</Text>
                {items.map(r => (
                  <HistResaCard
                    key={r.id}
                    r={r}
                    onPress={() => r.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: r.restaurants })}
                    onReserveAgain={r.restaurants?.id
                      ? () => navigation?.navigate('ReservationForm', { restaurant: r.restaurants })
                      : null
                    }
                    onReview={openReview}
                    hasReview={reviewedIds.has(r.id)}
                  />
                ))}
              </View>
            ))
          )
        )}

        <View style={{ height:100 }} />
      </ScrollView>

      <ReviewModal
        resa={reviewTarget}
        visible={!!reviewTarget}
        onClose={closeReview}
        onSubmit={handleSubmitReview}
        submitting={submitting}
      />

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor: colors.bg },

  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: colors.accent, fontSize: typography.size.xs, letterSpacing:3, marginBottom: spacing.xs },
  headerTitle: { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing:0.3 },
  pendingPill: { flexDirection:'row', alignItems:'center', gap: spacing.sm, backgroundColor: colors.accentSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth:1, borderColor:'rgba(232,160,69,0.3)' },
  pendingDot:  { width:6, height:6, borderRadius:3, backgroundColor: colors.accent },
  pendingTxt:  { color: colors.accent, fontSize: typography.size.caption },

  tabs:       { flexDirection:'row', margin: spacing.xl, backgroundColor: colors.cardHover, borderRadius: radius.xl, padding: spacing.xs, borderWidth:1, borderColor: colors.cardBorder, gap: spacing.xxs },
  tab:        { flex:1, flexDirection:'row', paddingVertical: spacing.md, borderRadius: radius.lg, alignItems:'center', justifyContent:'center', gap: spacing.sm },
  tabOn:      { backgroundColor: colors.card },
  tabTxt:     { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:   { color: colors.text, fontWeight: typography.weight.regular },
  tabBadge:   { backgroundColor: colors.accent, borderRadius: radius.md, minWidth:18, height:18, alignItems:'center', justifyContent:'center', paddingHorizontal: spacing.xs },
  tabBadgeTxt:{ color: colors.bg, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },

  sectionLbl: { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:4, paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },
  monthLbl:   { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:3, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md, borderBottomWidth:1, borderBottomColor: colors.cardBorder },

  empty:      { alignItems:'center', paddingTop:80, gap: spacing.lg },
  emptyEmoji: { fontSize:52 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign:'center', lineHeight:20, paddingHorizontal: spacing.section },
  emptyBtn:   { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderWidth:1, borderColor: colors.cardBorder, marginTop: spacing.xs },
  emptyBtnTxt:{ color: colors.blue, fontSize: typography.size.bodyLg },
});
