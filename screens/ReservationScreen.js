import { useCallback, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useReservations, { daysUntil } from '../src/hooks/useReservations';
import useMyReservations from '../src/hooks/useMyReservations';
import NextResaCard from '../src/components/NextResaCard';
import ReservationCard from '../src/components/ReservationCard';
import HistResaCard from '../src/components/HistResaCard';
import ReviewModal from '../src/components/ReviewModal';
import GuestWall from '../src/components/GuestWall';
import { useGuestContext } from '../src/context/GuestContext';

// ── Feedback helpers pour la NextResaCard (cancel EF) ─────────────────────
function nextFbStyle(status) {
  if (status === 'ok')                 return { backgroundColor: colors.greenSoft,  borderColor: 'rgba(76,175,130,0.30)' };
  if (status === 'pending_validation') return { backgroundColor: colors.blueSoft,   borderColor: 'rgba(90,155,224,0.30)' };
  return                                      { backgroundColor: colors.redSoft,    borderColor: 'rgba(224,90,90,0.30)'  };
}
function nextFbColor(status) {
  if (status === 'ok')                 return { color: colors.green  };
  if (status === 'pending_validation') return { color: colors.blue   };
  return                                      { color: colors.red    };
}
function nextFbMsg(fb) {
  if (fb.status === 'ok')                 return '✓  Annulation enregistrée.';
  if (fb.status === 'pending_validation') return '⏳  Demande transmise au restaurant.';
  return `✕  ${fb.reason || 'Impossible pour le moment.'}`;
}

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
  const { isGuest } = useGuestContext();

  // ── Historique + reviews (tab "Historique") ──────────────────────────────
  const {
    tab, setTab,
    historique, histByMonth,
    reviewedIds, pendingReviewIds,
    submitReview,
    onRefresh: refreshHistory,
  } = useReservations();

  // ── Réservations à venir + actions EF (tab "À venir") ───────────────────
  const myResas = useMyReservations();

  const loading    = myResas.loading;
  const refreshing = myResas.refreshing || false;
  const onRefresh  = useCallback(() => {
    myResas.load(true);
    refreshHistory();
  }, [myResas.load, refreshHistory]);

  // Dérivés : prochaine + suite
  const today  = new Date().toISOString().split('T')[0];
  const next   = myResas.upcomingResas[0] ?? null;
  const later  = myResas.upcomingResas.slice(1);
  const aVenir = myResas.upcomingResas;
  const pending = useMemo(
    () => aVenir.filter(r => r.status === 'pending').length,
    [aVenir],
  );

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
  const onCancelNext = useCallback(() => next && myResas.cancel(next.id), [myResas.cancel, next]);
  const onViewNext   = useCallback(
    () => next?.restaurants?.id && navigation?.navigate('Restaurant', { restaurant: next.restaurants }),
    [navigation, next],
  );
  const onEditResa   = useCallback(
    (r) => r?.restaurants?.id && navigation?.navigate('ReservationForm', { restaurant: r.restaurants, reservation: r }),
    [navigation],
  );

  if (isGuest) {
    return <GuestWall title="Mes réservations" message="Connectez-vous pour gérer vos réservations et ne rater aucune table." />;
  }

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
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />

      <View style={s.header}>
        <View style={{ flex:1 }}>
          <Text style={s.headerSub}>MES RÉSERVATIONS</Text>
          {aVenir.length > 0 && next ? (
            next.date === today ? (
              <View>
                <Text style={s.headerLabel}>Ce soir chez</Text>
                <Text style={s.headerTitle} numberOfLines={1}>{next.restaurants?.name || '…'}</Text>
              </View>
            ) : (
              <View>
                <Text style={s.headerLabel}>Prochaine table</Text>
                <Text style={s.headerTitle}>{daysUntil(next.date)}</Text>
              </View>
            )
          ) : (
            <Text style={s.headerTitle}>
              {aVenir.length > 0 ? 'À venir' : 'Aucune réservation'}
            </Text>
          )}
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
              {myResas.feedback[next?.id] && (
                <View style={[s.nextFeedback, nextFbStyle(myResas.feedback[next.id].status)]}>
                  <Text style={[s.nextFeedbackTxt, nextFbColor(myResas.feedback[next.id].status)]}>
                    {nextFbMsg(myResas.feedback[next.id])}
                  </Text>
                  <TouchableOpacity onPress={() => myResas.clearFeedback(next.id)}>
                    <Text style={[s.nextFeedbackDismiss, nextFbColor(myResas.feedback[next.id].status)]}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {later.length > 0 && (
                <>
                  <Text style={[s.sectionLbl, { marginTop: spacing.xxl }]}>
                    PLUS TARD  ·  {later.length}
                  </Text>
                  {later.map(r => (
                    <ReservationCard
                      key={r.id}
                      r={r}
                      acting={myResas.acting.has(r.id)}
                      feedback={myResas.feedback[r.id] ?? null}
                      onClearFeedback={() => myResas.clearFeedback(r.id)}
                      onCancel={myResas.cancel}
                      onModifyTime={myResas.modifyTime}
                      onModifyParty={myResas.modifyParty}
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
                    isPendingReview={pendingReviewIds.has(r.id)}
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
  root:      { flex:1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: '#C87860', fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.xs },
  headerLabel: { color: colors.textMuted, fontSize: typography.size.caption, letterSpacing: 1, marginBottom: spacing.xxs },
  headerTitle: { color: colors.text, fontSize: typography.size.hero, fontWeight: '200', letterSpacing: -0.5 },
  pendingPill: { flexDirection:'row', alignItems:'center', gap: spacing.sm, backgroundColor: colors.navy, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth:1, borderColor: colors.navyBorder },
  pendingDot:  { width:6, height:6, borderRadius:0, backgroundColor: '#C87860' },
  pendingTxt:  { color: colors.text, fontSize: typography.size.caption },

  tabs:       { flexDirection:'row', margin: spacing.xl, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: radius.xl, padding: spacing.xs, borderWidth:1, borderColor: colors.cardBorder, gap: spacing.xxs },
  tab:        { flex:1, flexDirection:'row', paddingVertical: spacing.md, borderRadius: radius.lg, alignItems:'center', justifyContent:'center', gap: spacing.sm },
  tabOn:      { backgroundColor: colors.navy, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  tabTxt:     { color: colors.textMuted, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:   { color: colors.text, fontWeight: typography.weight.semibold },
  tabBadge:   { backgroundColor: '#C87860', borderRadius: radius.md, minWidth:18, height:18, alignItems:'center', justifyContent:'center', paddingHorizontal: spacing.xs },
  tabBadgeTxt:{ color: '#FFFFFF', fontSize: typography.size.sm, fontWeight: typography.weight.semibold },

  sectionLbl: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing:4, paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },
  nextFeedback:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.lg, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
  nextFeedbackTxt:     { flex: 1, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, lineHeight: 18 },
  nextFeedbackDismiss: { fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  monthLbl:   { color: colors.textDim, fontSize: typography.size.xs, letterSpacing:3, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md, borderBottomWidth:1, borderBottomColor: colors.cardBorder },

  empty:      { alignItems:'center', paddingTop:80, gap: spacing.lg },
  emptyEmoji: { fontSize:52 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign:'center', lineHeight:20, paddingHorizontal: spacing.section },
  emptyBtn:   { backgroundColor: colors.navy, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderWidth:1, borderColor: 'rgba(200,151,90,0.35)', marginTop: spacing.xs, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  emptyBtnTxt:{ color: colors.text, fontSize: typography.size.bodyLg },
});
