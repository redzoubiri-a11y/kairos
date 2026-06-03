import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';
import useDashboard, { FILTERS, DATE_FILTERS } from '../src/hooks/useDashboard';
import WeekStrip from '../src/components/WeekStrip';
import StatCard from '../src/components/StatCard';
import AlertBanner from '../src/components/AlertBanner';
import MidaLogo from '../src/components/MidaLogo';
import DashResaCard from '../src/components/DashResaCard';

function SkeletonDashboard() {
  return (
    <View style={{ padding: spacing.xxl }}>
      <MLoader width="55%" height={18} borderRadius={radius.sm} style={{ marginBottom: spacing.sm }} />
      <MLoader width="35%" height={12} borderRadius={radius.sm} style={{ marginBottom: spacing.xxxl }} />
      <View style={{ flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.xl }}>
        {[1,2,3].map(i => <MLoader key={i} width={116} height={88} borderRadius={radius.xxl} />)}
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

  const {
    restaurant, reservations, loading, refreshing,
    filter, setFilter, dateFilter, setDateFilter,
    acting,
    confirm, cancel, markArrived, signOut, onRefresh,
    todayResas, pendingAll, confirmedToday, totalCovers, revenue, upcomingCount,
    filtered, showGroups, midi, soir,
    greetingTxt, t,
  } = useDashboard();

  const goPromos   = useCallback(() => navigation.navigate('ProPromos'),   [navigation]);
  const goComptoir = useCallback(() => navigation.navigate('ProComptoir'), [navigation]);
  const goMenu     = useCallback(() => navigation.navigate('ProMenu'),     [navigation]);
  const goAvis     = useCallback(() => navigation.navigate('ProAvis'),     [navigation]);
  const goPhotos   = useCallback(() => navigation.navigate('ProPhotos', { restaurantId: restaurant?.id }), [navigation, restaurant]);

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <SkeletonDashboard />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <MidaLogo showTagline={false} style={{ alignItems: 'flex-start', marginBottom: spacing.xs }} />
            <Text style={s.headerGreeting}>{greetingTxt} 👋</Text>
            <Text style={s.headerTitle}>{restaurant?.name || 'Manager'}</Text>
          </View>
          <View style={{ gap: spacing.md, alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={s.comptoirBtn} onPress={goMenu}>
                <Text style={s.comptoirBtnTxt}>🍽️  Menu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.comptoirBtn} onPress={goAvis}>
                <Text style={s.comptoirBtnTxt}>⭐  Avis</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={s.comptoirBtn} onPress={goPhotos}>
                <Text style={s.comptoirBtnTxt}>📷  Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.comptoirBtn} onPress={goPromos}>
                <Text style={s.comptoirBtnTxt}>🏷️  Promos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.comptoirBtn} onPress={goComptoir}>
                <Text style={s.comptoirBtnTxt}>📟  Comptoir</Text>
              </TouchableOpacity>
            </View>
            <View style={s.onlineBadge}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>En ligne</Text>
            </View>
          </View>
        </View>

        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
          <StatCard icon="📅" value={todayResas.length}    label={`Résa\naujourd'hui`} color={colors.blue} />
          <StatCard icon="⏳" value={pendingAll.length}     label="En attente"          color={colors.accent} alert={pendingAll.length > 0} sub={pendingAll.length > 0 ? 'Action requise' : ''} />
          <StatCard icon="✅" value={confirmedToday.length} label={`Confirmées\nauj.`}  color={colors.green} />
          <StatCard icon="🪑" value={totalCovers}           label="Couverts\nconfirmés" color={colors.textMuted} />
          {revenue != null && (
            <StatCard icon="💰" value={`${(revenue/1000).toFixed(0)}k`} label="Revenus est.\naujourd'hui" color={colors.accent} sub="DA" />
          )}
        </ScrollView>

        <AlertBanner pendingCount={pendingAll.length} upcomingCount={upcomingCount} />
        <WeekStrip reservations={reservations} />

        {/* Date filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {DATE_FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.chip, dateFilter === f && s.chipOn]} onPress={() => setDateFilter(f)}>
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
  root: { flex: 1, backgroundColor: colors.bg },

  header:         { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, gap: spacing.lg },
  headerGreeting: { color: colors.textMuted, fontSize: typography.size.body, marginBottom: spacing.xxs },
  headerTitle:    { color: colors.text, fontSize: typography.size.title + 4, fontWeight: '300', letterSpacing: 0.5 },
  comptoirBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 1, borderRadius: radius.lg, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  comptoirBtnTxt: { color: colors.accent, fontSize: typography.size.body },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.greenSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.25)' },
  onlineDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  onlineTxt:      { color: colors.green, fontSize: typography.size.sm },

  statsRow: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.lg },

  chipRow:   { paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg, gap: spacing.md },
  chip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 1, borderRadius: radius.full, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipOn:    { backgroundColor: colors.accentSoft, borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  chipTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  chipTxtOn: { color: colors.accent, fontWeight: typography.weight.semibold },

  statusTabs:     { flexDirection: 'row', marginHorizontal: spacing.xxl, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxs + 1, gap: spacing.xxs },
  statusTab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md + 1, borderRadius: radius.lg, gap: spacing.xs },
  statusTabOn:    { backgroundColor: colors.accentSoft, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  statusTabTxt:   { color: colors.textDim, fontSize: typography.size.caption },
  statusTabTxtOn: { color: colors.accent, fontWeight: typography.weight.semibold },
  badge:          { backgroundColor: colors.accent, borderRadius: radius.md, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxs + 1 },
  badgeTxt:       { color: colors.bg, fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  listHead:    { paddingHorizontal: spacing.xxl, paddingBottom: spacing.md },
  listHeadTxt: { color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 2 },

  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, marginTop: spacing.xs },
  groupIcon:   { fontSize: 14 },
  groupLabel:  { color: colors.text, fontSize: typography.size.bodyLg, flex: 1 },
  groupCount:  { color: colors.textDim, fontSize: typography.size.caption },

  empty:      { alignItems: 'center', paddingVertical: 48, gap: spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: colors.textMuted, fontSize: typography.size.subheading, fontWeight: '300' },
  emptyDesc:  { color: colors.textDim, fontSize: typography.size.body },

  signOutBtn: { marginHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(224,90,90,0.2)', alignItems: 'center' },
  signOutTxt: { color: colors.red, fontSize: typography.size.bodyLg },
});
