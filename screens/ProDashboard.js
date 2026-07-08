import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import useProOnboarding from '../src/hooks/useProOnboarding';
import { useMonthlyReport } from '../src/hooks/useMonthlyReport';
import MonthlyReport from '../src/components/MonthlyReport';

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
    filtered, showGroups, midi, soir,
    greetingTxt, t,
  } = useDashboard();

  const { visible: setupVisible, visited, markVisited, dismiss: dismissSetup, reset: resetSetup } = useProOnboarding();
  const { report: monthlyReport, loading: monthlyLoading, error: monthlyError, refetch: refetchReport } = useMonthlyReport(restaurant?.id);

  const goPromos   = useCallback(() => navigation.navigate('ProPromos'),   [navigation]);
  const goComptoir = useCallback(() => navigation.navigate('ProComptoir'), [navigation]);
  const goMenu     = useCallback(() => navigation.navigate('ProMenu'),     [navigation]);
  const goAvis     = useCallback(() => navigation.navigate('ProAvis'),     [navigation]);
  const goPhotos   = useCallback(() => navigation.navigate('ProPhotos', { restaurantId: restaurant?.id }), [navigation, restaurant]);
  const goInfo     = useCallback(() => navigation.navigate('ProInfo'),     [navigation]);
  const goHoraires = useCallback(() => navigation.navigate('ProHoraires'), [navigation]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <LinearGradient colors={['#0D1628', '#162040']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.darkHeader}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.headerGreeting}>{greetingTxt} 👋</Text>
              <Text style={s.headerTitle}>{restaurant?.name || 'Manager'}</Text>
            </View>
            <View style={s.onlineBadge}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>En ligne</Text>
            </View>
          </View>

          {/* Actions rapides */}
          <View style={s.actionsRow}>
          <TouchableOpacity style={s.comptoirBtn} onPress={goMenu}>
            <Text style={s.comptoirIcon}>🍽️</Text>
            <Text style={s.comptoirBtnTxt}>Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.comptoirBtn} onPress={goAvis}>
            <Text style={s.comptoirIcon}>⭐</Text>
            <Text style={s.comptoirBtnTxt}>Avis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.comptoirBtn} onPress={goPhotos}>
            <Text style={s.comptoirIcon}>📷</Text>
            <Text style={s.comptoirBtnTxt}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.comptoirBtn} onPress={goPromos}>
            <Text style={s.comptoirIcon}>🏷️</Text>
            <Text style={s.comptoirBtnTxt}>Promos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.comptoirBtn} onPress={goComptoir}>
            <Text style={s.comptoirIcon}>📟</Text>
            <Text style={s.comptoirBtnTxt}>Comptoir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.comptoirBtn} onPress={goInfo}>
            <Text style={s.comptoirIcon}>✏️</Text>
            <Text style={s.comptoirBtnTxt}>Infos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.comptoirBtn} onPress={goHoraires}>
            <Text style={s.comptoirIcon}>🕐</Text>
            <Text style={s.comptoirBtnTxt}>Horaires</Text>
          </TouchableOpacity>
        </View>
        </LinearGradient>

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

        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard icon="📅" value={todayResas.length}    label="Résa auj."  color={colors.blue} />
          <StatCard icon="⏳" value={pendingAll.length}     label="En attente"         color={colors.accent} alert={pendingAll.length > 0} sub={pendingAll.length > 0 ? 'Action requise' : ''} />
          <StatCard icon="✅" value={confirmedToday.length} label="Confirmées"          color={colors.green} />
          <StatCard icon="🪑" value={totalCovers}           label="Couverts"            color={'rgba(245,242,236,0.70)'} />
          {revenue != null && (
            <StatCard icon="💰" value={`${(revenue/1000).toFixed(0)}k`} label="Revenus DA" color={colors.accent} />
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
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyTitle}>Aucune réservation</Text>
            <Text style={s.emptyDesc}>Modifiez les filtres pour voir plus de résultats.</Text>
          </View>
        ) : showGroups ? (
          <>
            {midi.length > 0 && (
              <>
                <View style={s.groupHeader}>
                  <Text style={s.groupIcon}>☀️</Text>
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
                  <Text style={s.groupIcon}>🌙</Text>
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
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📭</Text>
                <Text style={s.emptyTitle}>Aucune réservation aujourd'hui</Text>
              </View>
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
          <Text style={s.signOutTxt}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0D1B2A', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  darkHeader:     { paddingBottom: spacing.lg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  headerLeft:     { flex: 1 },
  headerGreeting: { color: 'rgba(245,242,236,0.55)', fontSize: typography.size.caption, letterSpacing: 2, marginBottom: spacing.xxs },
  headerTitle:    { color: '#F5F2EC', fontSize: typography.size.title, fontWeight: '300', letterSpacing: 0.5 },
  actionsRow:     { flexDirection: 'row', paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm, gap: spacing.sm },
  comptoirBtn:    { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.30)' },
  comptoirIcon:   { fontSize: 16, marginBottom: spacing.xxs },
  comptoirBtnTxt: { color: 'rgba(245,242,236,0.80)', fontSize: typography.size.xs },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(76,175,130,0.15)', borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.35)' },
  onlineDot:      { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.green },
  onlineTxt:      { color: colors.green, fontSize: typography.size.sm },

  statsRow: { paddingHorizontal: spacing.xxl, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },

  sep:       { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: spacing.xxl, marginVertical: spacing.sm },

  chipRow:   { paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm, gap: spacing.sm },
  chip:      { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  chipOn:    { backgroundColor: 'rgba(200,151,90,0.20)', borderColor: '#c8975a' },
  chipTxt:   { color: 'rgba(245,242,236,0.55)', fontSize: typography.size.body },
  chipTxtOn: { color: '#C87860', fontWeight: typography.weight.semibold },

  statusTabs:     { flexDirection: 'row', marginHorizontal: spacing.xxl, marginBottom: spacing.md, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: spacing.xxs + 1, gap: spacing.xxs },
  statusTab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.lg, gap: spacing.xs },
  statusTabOn:    { backgroundColor: 'rgba(255,255,255,0.15)' },
  statusTabTxt:   { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.caption },
  statusTabTxtOn: { color: '#F5F2EC', fontWeight: typography.weight.semibold },
  badge:          { backgroundColor: '#C87860', borderRadius: radius.md, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxs + 1 },
  badgeTxt:       { color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  listHead:    { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xs },
  listHeadTxt: { color: 'rgba(245,242,236,0.40)', fontSize: typography.size.sm, letterSpacing: 2 },

  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, marginTop: spacing.xs },
  groupIcon:   { fontSize: 14 },
  groupLabel:  { color: '#F5F2EC', fontSize: typography.size.bodyLg, flex: 1 },
  groupCount:  { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.caption },

  empty:      { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: 'rgba(245,242,236,0.65)', fontSize: typography.size.subheading, fontWeight: '300' },
  emptyDesc:  { color: 'rgba(245,242,236,0.40)', fontSize: typography.size.body },

  signOutBtn: { marginHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(224,90,90,0.25)', alignItems: 'center' },
  signOutTxt: { color: 'rgba(224,90,90,0.80)', fontSize: typography.size.bodyLg },
});
