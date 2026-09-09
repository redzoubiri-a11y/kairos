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
    erreur: histErreur, reessayer: retryHistory,
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
  const [reviewError,  setReviewError]  = useState('');

  const openReview  = useCallback((r) => { setReviewError(''); setReviewTarget(r); }, []);
  const closeReview = useCallback(() => { setReviewError(''); setReviewTarget(null); }, []);

  const handleSubmitReview = useCallback(async (resa, rating, comment) => {
    setSubmitting(true);
    setReviewError('');
    try {
      await submitReview(resa, rating, comment);
      setReviewTarget(null);
    } catch (e) {
      setReviewError("Impossible de publier l'avis pour le moment. Réessayez plus tard.");
    } finally {
      setSubmitting(false);
    }
  }, [submitReview]);

  const goExplorer   = useCallback(() => navigation?.navigate('Explorer'), [navigation]);
  const onCancelNext = useCallback(() => next && myResas.cancel(next.id), [myResas.cancel, next]);
  const onViewNext   = useCallback(
    () => next?.restaurants?.id && navigation?.navigate('Restaurant', { id: next.restaurants.id, restaurant: next.restaurants }),
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
      <LinearGradient colors={colors.photoFallbackGradient} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />

      <View style={s.header}>
        <View style={{ flex:1 }}>
          <Text style={s.headerSub}>MES RÉSERVATIONS</Text>
          {aVenir.length > 0 && next ? (
            next.date === today ? (
              <View>
                <Text style={s.headerLabel}>Ce soir</Text>
                <Text style={s.headerTitle}>à {next.time_slot?.slice(0, 5) || '—'}</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {tab === 'avenir' && (
          myResas.erreur ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>{myResas.erreur === 'network' ? '📡' : '⚠️'}</Text>
              <Text style={s.emptyTitle}>{myResas.erreur === 'network' ? 'Pas de connexion' : 'Erreur serveur'}</Text>
              <Text style={s.emptySub}>
                {myResas.erreur === 'network' ? 'Vérifie ta connexion internet.' : "Une erreur inattendue s'est produite."}
              </Text>
              <TouchableOpacity onPress={() => myResas.load()} style={s.retryBtn}>
                <Text style={s.retryBtnTxt}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : !next ? (
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
          histErreur ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>{histErreur === 'network' ? '📡' : '⚠️'}</Text>
              <Text style={s.emptyTitle}>{histErreur === 'network' ? 'Pas de connexion' : 'Erreur serveur'}</Text>
              <Text style={s.emptySub}>
                {histErreur === 'network' ? 'Vérifie ta connexion internet.' : "Une erreur inattendue s'est produite."}
              </Text>
              <TouchableOpacity onPress={retryHistory} style={s.retryBtn}>
                <Text style={s.retryBtnTxt}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : historique.length === 0 ? (
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
                    onPress={() => r.restaurants?.id && navigation?.navigate('Restaurant', { id: r.restaurants.id, restaurant: r.restaurants })}
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
        serverError={reviewError}
      />

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex:1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth:1, borderBottomColor: colors.cardBorder },
  headerSub:   { color: colors.resa, fontFamily: typography.bodyBold, fontSize: typography.size.xs, letterSpacing: 3, marginBottom: spacing.xs },
  headerLabel: { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.caption, letterSpacing: 1, marginBottom: spacing.xxs },
  headerTitle: { color: colors.text, fontFamily: typography.display, fontSize: typography.size.hero, letterSpacing: -0.5 },
  pendingPill: { flexDirection:'row', alignItems:'center', gap: spacing.sm, backgroundColor: colors.resaSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth:1, borderColor: 'rgba(200,120,96,0.3)' },
  pendingDot:  { width:6, height:6, borderRadius:3, backgroundColor: colors.resa },
  pendingTxt:  { color: colors.text, fontFamily: typography.bodyMedium, fontSize: typography.size.caption },

  tabs:       { flexDirection:'row', margin: spacing.xl, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: radius.xl, padding: spacing.xs, borderWidth:1, borderColor: colors.cardBorder, gap: spacing.xxs },
  tab:        { flex:1, flexDirection:'row', paddingVertical: spacing.md, borderRadius: radius.lg, alignItems:'center', justifyContent:'center', gap: spacing.sm },
  tabOn:      { backgroundColor: colors.card },
  tabTxt:     { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.bodyLg },
  tabTxtOn:   { color: colors.text, fontFamily: typography.bodySemibold },
  tabBadge:   { backgroundColor: colors.resa, borderRadius: radius.md, minWidth:18, height:18, alignItems:'center', justifyContent:'center', paddingHorizontal: spacing.xs },
  tabBadgeTxt:{ color: colors.card, fontFamily: typography.bodySemibold, fontSize: typography.size.sm },

  sectionLbl: { color: colors.textMuted, fontFamily: typography.bodyBold, fontSize: typography.size.xs, letterSpacing:4, paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },
  nextFeedback:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.lg, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
  nextFeedbackTxt:     { flex: 1, fontFamily: typography.bodyMedium, fontSize: typography.size.bodyLg, lineHeight: 18 },
  nextFeedbackDismiss: { fontFamily: typography.bodyBold, fontSize: typography.size.caption },
  monthLbl:   { color: colors.textDim, fontFamily: typography.bodyBold, fontSize: typography.size.xs, letterSpacing:3, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, paddingBottom: spacing.md, borderBottomWidth:1, borderBottomColor: colors.cardBorder },

  empty:      { alignItems:'center', paddingTop:80, gap: spacing.lg },
  emptyEmoji: { fontSize:52 },
  emptyTitle: { color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading2 },
  emptySub:   { color: colors.textMuted, fontFamily: typography.body, fontSize: typography.size.bodyLg, textAlign:'center', lineHeight:20, paddingHorizontal: spacing.section },
  emptyBtn:   { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginTop: spacing.xs },
  retryBtn:   { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, marginTop: spacing.xs },
  retryBtnTxt:{ color: colors.text, fontFamily: typography.bodyMedium, fontSize: typography.size.bodyLg },
  emptyBtnTxt:{ color: colors.card, fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg },
});
