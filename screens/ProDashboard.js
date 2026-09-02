import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';
import useDashboard, { FILTERS, DATE_FILTERS } from '../src/hooks/useDashboard';
import WeekStrip from '../src/components/WeekStrip';
import StatCard from '../src/components/StatCard';
import AlertBanner from '../src/components/AlertBanner';
import DashResaCard from '../src/components/DashResaCard';
import ProSetupCard from '../src/components/ProSetupCard';
import RestaurantCompletionCard from '../src/components/RestaurantCompletionCard';
import useProOnboarding from '../src/hooks/useProOnboarding';
import { useMonthlyReport } from '../src/hooks/useMonthlyReport';
import MonthlyReport from '../src/components/MonthlyReport';
import useProOrders from '../src/hooks/useProOrders';
import OrderCard from '../src/components/OrderCard';
import EmptyState from '../src/components/EmptyState';

function SkeletonDashboard() {
  return (
    <View style={{ padding: spacing.xxl }}>
      <MLoader width="55%" height={18} borderRadius={radius.sm} style={{ marginBottom: spacing.sm }} />
      <MLoader width="35%" height={12} borderRadius={radius.sm} style={{ marginBottom: spacing.xxxl }} />
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl }}>
        {[1,2,3].map(i => <MLoader key={i} width={100} height={74} borderRadius={radius.xxl} />)}
      </View>
      <MLoader width="100%" height={56} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      {[1,2,3].map(i => (
        <MLoader key={i} width="100%" height={110} borderRadius={radius.xl} style={{ marginBottom: spacing.lg }} />
      ))}
    </View>
  );
}

export default function ProDashboard({ navigation }) {
  usePushNotifications(navigation);
  useDeepLink(navigation);
  const insets = useSafeAreaInsets();
  useFocusEffect(useCallback(() => {
    ScreenOrientation.unlockAsync();
    return () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []));

  const {
    restaurant, reservations, loading, refreshing, erreur, reessayer,
    filter, setFilter, dateFilter, setDateFilter,
    acting,
    confirm, cancel, markArrived, signOut, onRefresh,
    todayResas, pendingAll, confirmedToday, totalCovers, revenue, upcomingCount,
    upcomingResas, occupancyPct,
    filtered, showGroups, midi, soir,
    t,
  } = useDashboard();

  const { visible: setupVisible, visited, markVisited, dismiss: dismissSetup, reset: resetSetup } = useProOnboarding();
  const { report: monthlyReport, loading: monthlyLoading, error: monthlyError, refetch: refetchReport } = useMonthlyReport(restaurant?.id);

  const {
    orders: proOrders, advance: advanceOrder, cancel: cancelOrder,
    acting: orderActing, NEXT_LABEL,
  } = useProOrders();
  const nextOrder = proOrders.find(o => ['pending', 'confirmed', 'ready'].includes(o.status)) || null;
  const ordersInProgressCount = proOrders.filter(o => ['pending', 'confirmed', 'ready'].includes(o.status)).length;

  const goPromos   = useCallback(() => navigation.navigate('ProPromos'),   [navigation]);
  const goComptoir = useCallback(() => navigation.navigate('ProComptoir'), [navigation]);
  const goMenu     = useCallback(() => navigation.navigate('ProMenu'),     [navigation]);
  const goAvis     = useCallback(() => navigation.navigate('ProAvis'),     [navigation]);
  const goPhotos   = useCallback(() => navigation.navigate('ProPhotos', { restaurantId: restaurant?.id }), [navigation, restaurant]);
  const goInfo     = useCallback(() => navigation.navigate('ProInfo'),     [navigation]);
  const goHoraires = useCallback(() => navigation.navigate('ProHoraires'), [navigation]);
  const goOrders   = useCallback(() => navigation.navigate('ProOrders'),   [navigation]);

  const [headerH, setHeaderH] = useState(0);

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <SkeletonDashboard />
      </SafeAreaView>
    );
  }

  // Plein écran assumé : sans les réservations, aucune tuile du tableau de
  // bord n'a de sens — les chiffres afficheraient zéro partout, ce qui
  // équivaudrait à mentir sur l'activité du restaurant. Ne se déclenche que
  // sur le tout premier chargement (cf. useDashboard) : les rechargements de
  // fond gardent l'écran affiché tel quel plutôt que de le remplacer.
  if (erreur) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl }}>
          <EmptyState
            icon={<Text style={{ fontSize: 20 }}>{erreur === 'network' ? '📡' : '⚠️'}</Text>}
            title={erreur === 'network' ? 'Pas de connexion' : 'Erreur serveur'}
            subtitle={erreur === 'network' ? 'Vérifie ta connexion internet.' : "Une erreur inattendue s'est produite."}
            actionLabel="Réessayer"
            onAction={reessayer}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Bandeau — flotte en fixe au-dessus du contenu scrollable */}
      <View style={[s.darkHeader, { paddingTop: insets.top }]} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.hRow}>
              <Text style={s.headerTitle} numberOfLines={1}>{restaurant?.name || 'Manager'}</Text>
              <View style={s.proBadge}><Text style={s.proBadgeTxt}>PRO</Text></View>
            </View>
            <Text style={s.headerSub} numberOfLines={1}>Bonjour, gérez votre établissement</Text>
          </View>
          <View style={s.onlineBadge}>
            <View style={s.onlineDot} />
            <Text style={s.onlineTxt} numberOfLines={1} maxFontSizeMultiplier={1.3}>En ligne</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerH }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Statistiques du jour — cartes élevées chevauchant le bandeau, comme Pro Dashboard.dc.html */}
        <View style={s.statRow}>
          <View style={s.statCardFloat}>
            <Text style={s.statCardVal}>{todayResas.length}</Text>
            <Text style={s.statCardLbl}>Réservations aujourd'hui</Text>
          </View>
          <View style={s.statCardFloat}>
            <Text style={s.statCardVal}>{ordersInProgressCount}</Text>
            <Text style={s.statCardLbl}>Commandes en cours</Text>
          </View>
        </View>

        {/* Accès rapide */}
        <Text style={s.sectionTitle}>Gérer</Text>
        <View style={s.quickGrid}>
          <TouchableOpacity style={s.quickBtn} onPress={goComptoir}>
            <Text style={s.quickBtnIco}>📋</Text>
            <Text style={s.quickBtnTxt}>Comptoir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goOrders}>
            <Text style={s.quickBtnIco}>🛍️</Text>
            <Text style={s.quickBtnTxt}>Commandes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goMenu}>
            <Text style={s.quickBtnIco}>🍽️</Text>
            <Text style={s.quickBtnTxt}>Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goAvis}>
            <Text style={s.quickBtnIco}>⭐</Text>
            <Text style={s.quickBtnTxt}>Avis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goPromos}>
            <Text style={s.quickBtnIco}>🏷️</Text>
            <Text style={s.quickBtnTxt}>Promotions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goInfo}>
            <Text style={s.quickBtnIco}>⚙️</Text>
            <Text style={s.quickBtnTxt}>Informations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goPhotos}>
            <Text style={s.quickBtnIco}>📸</Text>
            <Text style={s.quickBtnTxt}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goHoraires}>
            <Text style={s.quickBtnIco}>🕐</Text>
            <Text style={s.quickBtnTxt}>Horaires</Text>
          </TouchableOpacity>
        </View>

        {/* Prochaines réservations */}
        <View style={s.previewSectionHead}>
          <Text style={s.previewSectionTitle}>Prochaines réservations</Text>
          <TouchableOpacity onPress={goComptoir}>
            <Text style={s.previewSectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {upcomingResas.length === 0 ? (
          <Text style={s.previewEmpty}>Aucune réservation à venir.</Text>
        ) : (
          <View style={{ gap: spacing.md, paddingHorizontal: spacing.xxl, marginBottom: spacing.md }}>
            {upcomingResas.map(r => (
              <DashResaCard key={r.id} r={r}
                onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
                isActing={acting.has(r.id)} isToday={r.date === t} />
            ))}
          </View>
        )}

        {/* Commandes à emporter */}
        <View style={s.previewSectionHead}>
          <Text style={s.previewSectionTitle}>Commandes à emporter</Text>
          <TouchableOpacity onPress={goOrders}>
            <Text style={s.previewSectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        {!nextOrder ? (
          <Text style={s.previewEmpty}>Aucune commande en cours.</Text>
        ) : (
          <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.md }}>
            <OrderCard
              order={nextOrder} context="pro"
              title={[nextOrder.users?.first_name, nextOrder.users?.last_name].filter(Boolean).join(' ') || 'Client'}
              onAdvance={advanceOrder} advanceLabel={NEXT_LABEL[nextOrder.status]}
              onCancel={cancelOrder} acting={orderActing.has(nextOrder.id)}
            />
          </View>
        )}

        {setupVisible && (
          <ProSetupCard
            navigation={navigation}
            restaurantId={restaurant?.id}
            visited={visited}
            onVisit={markVisited}
            onDismiss={dismissSetup}
            onReset={resetSetup}
          />
        )}

        <RestaurantCompletionCard navigation={navigation} restaurantId={restaurant?.id} />

        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard value={todayResas.length}    label="Résa auj."  color={colors.blue} />
          <StatCard value={pendingAll.length}     label="En attente"         color={colors.gold} alert={pendingAll.length > 0} sub={pendingAll.length > 0 ? 'Action requise' : ''} />
          <StatCard value={confirmedToday.length} label="Confirmées"          color={colors.green} />
          <StatCard value={totalCovers}           label="Couverts"            color={colors.text} />
          {revenue != null && (
            <StatCard value={`${(revenue/1000).toFixed(0)}k`} label="Revenus DA" color={colors.gold} />
          )}
        </ScrollView>

        <AlertBanner pendingCount={pendingAll.length} upcomingCount={upcomingCount} />
        <View style={s.sep} />
        <WeekStrip reservations={reservations} />
        <View style={s.sep} />
        <MonthlyReport
          report={monthlyReport}
          loading={monthlyLoading}
          error={monthlyError}
          onRefetch={refetchReport}
        />
        <View style={s.sep} />

        {/* Date filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow} delayContentTouches={false}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity key={f} delayPressIn={0} style={[s.chip, dateFilter === f && s.chipOn]} onPress={() => setDateFilter(f)}>
              <Text style={[s.chipTxt, dateFilter === f && s.chipTxtOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status tabs */}
        <View style={s.statusTabs}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.statusTab, filter === f && s.statusTabOn]} onPress={() => setFilter(f)}>
              <Text style={[s.statusTabTxt, filter === f && s.statusTabTxtOn]}>{f}</Text>
              {f === 'En attente' && pendingAll.length > 0 && (
                <View style={s.badge}><Text style={s.badgeTxt}>{pendingAll.length}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.sep} />
        <View style={s.listHead}>
          <Text style={s.listHeadTxt}>{filtered.length} réservation{filtered.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            style={s.empty}
            title="Aucune réservation"
            subtitle="Modifiez les filtres pour voir plus de résultats."
          />
        ) : showGroups ? (
          <>
            {midi.length > 0 && (
              <>
                <View style={s.groupHeader}>
                  <Text style={s.groupLabel}>Déjeuner</Text>
                  <Text style={s.groupCount}>{midi.length} table{midi.length > 1 ? 's' : ''}</Text>
                </View>
                {midi.map(r => (
                  <DashResaCard key={r.id} r={r}
                    onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
                    isActing={acting.has(r.id)} isToday />
                ))}
              </>
            )}
            {soir.length > 0 && (
              <>
                <View style={s.groupHeader}>
                  <Text style={s.groupLabel}>Dîner</Text>
                  <Text style={s.groupCount}>{soir.length} table{soir.length > 1 ? 's' : ''}</Text>
                </View>
                {soir.map(r => (
                  <DashResaCard key={r.id} r={r}
                    onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
                    isActing={acting.has(r.id)} isToday />
                ))}
              </>
            )}
            {midi.length === 0 && soir.length === 0 && (
              <EmptyState
                style={s.empty}
                title="Aucune réservation aujourd'hui"
              />
            )}
          </>
        ) : (
          filtered.map(r => (
            <DashResaCard key={r.id} r={r}
              onConfirm={() => confirm(r)} onCancel={() => cancel(r)} onArrived={() => markArrived(r)}
              isActing={acting.has(r.id)} isToday={r.date === t} />
          ))
        )}

        <View style={{ height: spacing.xxxl }} />

        <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutTxt} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },

  darkHeader:     { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.noir, paddingBottom: spacing.xxl },
  header:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerLeft:     { flex: 1 },
  hRow:           { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  headerTitle:    { fontFamily: typography.display, color: '#FFFFFF', fontSize: typography.size.subheading + 2 },
  proBadge:       { backgroundColor: colors.primary, borderRadius: radius.sm + 1, paddingHorizontal: spacing.sm - 1, paddingVertical: 3 },
  proBadgeTxt:    { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: 9.5, letterSpacing: 0.5 },
  headerSub:      { fontFamily: typography.body, color: 'rgba(255,255,255,0.55)', fontSize: typography.size.caption, marginTop: spacing.xs },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0, backgroundColor: 'rgba(76,175,130,0.15)', borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.35)' },
  onlineDot:      { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.green },
  onlineTxt:      { fontFamily: typography.body, color: colors.green, fontSize: typography.size.sm },

  /* Cartes stats élevées, chevauchent le bas du bandeau — Pro Dashboard.dc.html */
  statRow:      { flexDirection: 'row', gap: spacing.sm + 2, paddingHorizontal: spacing.xl, marginTop: -spacing.lg },
  statCardFloat:{ flex: 1, backgroundColor: colors.card, borderRadius: radius.lg + 1, padding: spacing.lg + 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  statCardVal:  { fontFamily: typography.display, fontSize: 22, color: colors.text },
  statCardLbl:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.sm, marginTop: 3 },

  sectionTitle: { fontFamily: typography.display, fontSize: typography.size.body + 1.5, color: colors.text, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl - 2, marginBottom: spacing.md },

  /* Accès rapide (déplacé hors du bandeau noir) */
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2, paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  quickBtn:     { width: '48%', alignItems: 'flex-start', padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  quickBtnIco:  { fontSize: 20 },
  quickBtnTxt:  { fontFamily: typography.bodyBold, color: colors.text, fontSize: typography.size.body, marginTop: spacing.sm },

  /* Sections aperçu (résas / commandes) */
  previewSectionHead:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, marginBottom: spacing.md },
  previewSectionTitle: { fontFamily: typography.display, fontSize: typography.size.heading3, color: colors.text, letterSpacing: -0.2 },
  previewSectionLink:  { fontFamily: typography.bodySemibold, color: colors.primary, fontSize: typography.size.caption + 0.5 },
  previewEmpty:        { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.body, paddingHorizontal: spacing.xxl, marginBottom: spacing.lg },

  statsRow: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.sm, gap: spacing.sm },

  sep:       { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: spacing.xxl, marginVertical: spacing.sm },

  chipRow:   { paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm, gap: spacing.sm },
  chip:      { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipOn:    { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipTxt:   { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body },
  chipTxtOn: { fontFamily: typography.bodySemibold, color: colors.primary },

  statusTabs:     { flexDirection: 'row', marginHorizontal: spacing.xxl, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxs + 1, gap: spacing.xxs },
  statusTab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.lg, gap: spacing.xs },
  statusTabOn:    { backgroundColor: colors.cardHover },
  statusTabTxt:   { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption },
  statusTabTxtOn: { fontFamily: typography.bodySemibold, color: colors.text },
  badge:          { backgroundColor: colors.resa, borderRadius: radius.md, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxs + 1 },
  badgeTxt:       { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs },

  listHead:    { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xs },
  listHeadTxt: { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },

  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, marginTop: spacing.xs },
  groupLabel:  { color: colors.text, fontFamily: typography.display, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold, flex: 1 },
  groupCount:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption },

  empty:      { marginHorizontal: spacing.xxl },

  signOutBtn: { marginHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', alignItems: 'center' },
  signOutTxt: { fontFamily: typography.bodySemibold, color: colors.red, fontSize: typography.size.bodyLg },
});
