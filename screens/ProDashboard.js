import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
    restaurant, reservations, loading, refreshing,
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

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />

      {/* Bandeau — flotte en fixe au-dessus du contenu scrollable */}
      <View style={[s.darkHeader, { paddingTop: insets.top }]} onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerEyebrow} numberOfLines={1}>ESPACE PRO</Text>
            <Text style={s.headerTitle} numberOfLines={1}>{restaurant?.name || 'Manager'}</Text>
          </View>
          <View style={s.onlineBadge}>
            <View style={s.onlineDot} />
            <Text style={s.onlineTxt} numberOfLines={1} maxFontSizeMultiplier={1.3}>En ligne</Text>
          </View>
        </View>

        {/* Tuiles stats (Couverts / Taux d'occupation / CA du jour) */}
        <View style={s.tilesRow}>
          <View style={s.tile}>
            <Text style={s.tileVal}>{totalCovers}</Text>
            <Text style={s.tileLbl}>Couverts ce soir</Text>
          </View>
          <View style={s.tile}>
            <Text style={[s.tileVal, s.tileValGold]}>{occupancyPct != null ? `${occupancyPct}%` : '—'}</Text>
            <Text style={s.tileLbl}>Taux d'occupation</Text>
          </View>
          <View style={s.tile}>
            <Text style={s.tileVal}>{revenue != null ? `${Math.round(revenue / 1000)}k` : '—'}</Text>
            <Text style={s.tileLbl}>CA du jour (DA)</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: headerH }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Accès rapide */}
        <View style={s.quickGrid}>
          <TouchableOpacity style={s.quickBtn} onPress={goMenu}>
            <Text style={s.quickBtnTxt}>Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goAvis}>
            <Text style={s.quickBtnTxt}>Avis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goPhotos}>
            <Text style={s.quickBtnTxt}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goPromos}>
            <Text style={s.quickBtnTxt}>Promos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goComptoir}>
            <Text style={s.quickBtnTxt}>Comptoir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goOrders}>
            <Text style={s.quickBtnTxt}>Commandes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goInfo}>
            <Text style={s.quickBtnTxt}>Infos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={goHoraires}>
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
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  darkHeader:     { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.glassBgStrong, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl, paddingBottom: spacing.lg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  headerLeft:     { flex: 1 },
  headerEyebrow:  { fontFamily: typography.bodySemibold, color: colors.gold, fontSize: typography.size.caption - 0.5, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: spacing.xxs + 4 },
  headerTitle:    { fontFamily: typography.display, color: colors.text, fontSize: typography.size.heading1, letterSpacing: -0.4 },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0, backgroundColor: 'rgba(76,175,130,0.15)', borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.35)' },
  onlineDot:      { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.green },
  onlineTxt:      { fontFamily: typography.body, color: colors.green, fontSize: typography.size.sm },

  /* Tuiles stats dans le bandeau */
  tilesRow:    { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.lg + 6 },
  tile:        { flex: 1, backgroundColor: 'rgba(10,10,10,0.05)', borderRadius: radius.lg, padding: spacing.lg },
  tileVal:     { fontFamily: typography.display, fontSize: 21, color: colors.text },
  tileValGold: { color: colors.gold },
  tileLbl:     { fontFamily: typography.bodyMedium, color: colors.textMuted, fontSize: 10, marginTop: 5 },

  /* Accès rapide (déplacé hors du bandeau noir) */
  quickGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  quickBtn:     { width: '23%', alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  quickBtnTxt:  { fontFamily: typography.bodyBold, color: colors.text, fontSize: typography.size.xs },

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
