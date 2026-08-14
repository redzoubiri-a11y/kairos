import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, useWindowDimensions, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import EmptyState from '../src/components/EmptyState';
import useComptoir from '../src/hooks/useComptoir';
import Clock from '../src/components/Clock';
import ResaRow from '../src/components/ResaRow';
import CompactResaRow from '../src/components/CompactResaRow';
import ResaDetail from '../src/components/ResaDetail';
import BottomTabBar from '../src/components/BottomTabBar';

function SkeletonComptoir() {
  return (
    <View>
      {[1,2,3,4,5,6].map(i => (
        <View key={i} style={sk.row}>
          <MLoader width={90}  height={36} borderRadius={radius.sm} />
          <View style={{ flex: 1, gap: spacing.sm }}>
            <MLoader width="60%" height={26} borderRadius={radius.sm} />
            <MLoader width="35%" height={14} borderRadius={radius.sm} />
          </View>
          <MLoader width={60}  height={40} borderRadius={radius.sm} />
          <MLoader width={140} height={32} borderRadius={radius.lg} />
          <MLoader width={200} height={44} borderRadius={radius.lg} />
        </View>
      ))}
    </View>
  );
}
const sk = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxl, paddingVertical: spacing.xl, paddingHorizontal: spacing.xxxl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
});

export default function ProComptoir({ navigation }) {
  const {
    restaurant, reservations, visibleReservations, loading, refreshing,
    acting, selectedResa, selectedResaId, stats, emptyDateStr,
    selectedDate, isToday, goPrevDay, goNextDay, goToday,
    load, confirm, arrive, cancel, noShow, selectResa,
  } = useComptoir();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const insets = useSafeAreaInsets();

  useEffect(() => { ScreenOrientation.unlockAsync(); }, []);

  useFocusEffect(useCallback(() => {
    const t = setTimeout(() => ScreenOrientation.unlockAsync(), 350);
    return () => {
      clearTimeout(t);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []));

  const onRefresh = useCallback(() => load(true), [load]);

  const { total, confirmed, pending, arrived, no_show, covers } = stats;

  const renderCompact = useCallback(({ item }) => {
    if (item._sep) return (
      <View style={s.arrivedSep}>
        <View style={s.arrivedSepLine} />
        <Text style={s.arrivedSepTxt}>ARRIVÉS</Text>
        <View style={s.arrivedSepLine} />
      </View>
    );
    return (
      <CompactResaRow
        resa={item}
        isSelected={item.id === selectedResaId}
        onSelect={selectResa}
      />
    );
  }, [selectedResaId, selectResa]);

  const renderPortrait = useCallback(({ item, index }) => {
    if (item._sep) return (
      <View style={s.arrivedSep}>
        <View style={s.arrivedSepLine} />
        <Text style={s.arrivedSepTxt}>ARRIVÉS</Text>
        <View style={s.arrivedSepLine} />
      </View>
    );
    return (
      <ResaRow
        resa={item}
        index={index}
        onConfirm={confirm}
        onCancel={cancel}
        onArrive={arrive}
        acting={acting}
      />
    );
  }, [confirm, cancel, arrive, acting]);

  const h = new Date().getHours();
  const greeting = h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';

  const dayLabel = isToday
    ? `Aujourd'hui, ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const header = (
    <View style={s.header}>
      <View style={s.headerLeft}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.restoName}>{restaurant?.name || 'Mode comptoir'}</Text>
          <Text style={s.dateStr}>{greeting} 👋</Text>
        </View>
      </View>
      <View style={s.headerRight}>
        <Clock />
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} disabled={refreshing}>
          <Text style={s.refreshTxt}>{refreshing ? '···' : '↺'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const toolRow = (
    <View style={s.toolRow}>
      <View style={s.dateSelector}>
        <TouchableOpacity onPress={goPrevDay} hitSlop={8} style={s.dateArrow}>
          <Text style={s.dateArrowTxt}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToday} style={s.datePill} activeOpacity={0.7}>
          <Text style={s.datePillTxt} numberOfLines={1}>{dayLabel}</Text>
          <Text style={s.dateChevron}>▾</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNextDay} hitSlop={8} style={s.dateArrow}>
          <Text style={s.dateArrowTxt}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={s.planSalleBtn}>
        <Text style={s.planSalleTxt}>Plan de salle</Text>
        <Text style={s.planSalleSoon}>Bientôt</Text>
      </View>
    </View>
  );

  const statsMain = (
    <View style={s.statsMain}>
      <View style={[s.statCard, { backgroundColor: colors.tagGreenBg }]}>
        <Text style={[s.statCardVal, { color: colors.primary }]}>{total}</Text>
        <Text style={s.statCardLbl}>Réservations</Text>
      </View>
      <View style={[s.statCard, { backgroundColor: colors.goldSoft }]}>
        <Text style={[s.statCardVal, { color: colors.gold }]}>{pending}</Text>
        <Text style={s.statCardLbl}>En attente</Text>
      </View>
      <View style={[s.statCard, { backgroundColor: colors.tagNeutralBg }]}>
        <Text style={[s.statCardVal, { color: colors.text }]}>{covers}</Text>
        <Text style={s.statCardLbl}>Couverts</Text>
      </View>
    </View>
  );

  const statsSecondary = (
    <View style={s.statsSecondary}>
      <Text style={s.statsSecondaryItem}>{confirmed} confirmées</Text>
      <View style={s.statsSecondaryDot} />
      <Text style={s.statsSecondaryItem}>{arrived} arrivés</Text>
      <View style={s.statsSecondaryDot} />
      <Text style={s.statsSecondaryItem}>{no_show} no-show</Text>
    </View>
  );

  if (isLandscape) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
        {header}
        {toolRow}
        {statsMain}
        {statsSecondary}
        <View style={s.landscape}>
          <View style={s.leftPanel}>
            <View style={s.panelHeader}>
              <Text style={s.panelTitle}>RÉSERVATIONS</Text>
              {!loading && <Text style={s.panelCount}>{visibleReservations.length}</Text>}
            </View>
            {loading ? (
              <View style={{ padding: spacing.xl, gap: spacing.lg }}>
                {[1,2,3,4].map(i => <MLoader key={i} width="100%" height={64} borderRadius={radius.lg} />)}
              </View>
            ) : visibleReservations.length === 0 ? (
              <View style={s.center}>
                <EmptyState icon={<Text style={{ fontSize: 20 }}>📅</Text>} title="Aucune réservation" subtitle={emptyDateStr} />
              </View>
            ) : (
              <FlatList
                data={visibleReservations}
                keyExtractor={item => String(item.id)}
                renderItem={renderCompact}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 40 }}
                style={{ flex: 1 }}
              />
            )}
          </View>
          <View style={s.rightPanel}>
            <ResaDetail
              resa={selectedResa}
              onConfirm={confirm}
              onCancel={cancel}
              onArrive={arrive}
              onNoShow={noShow}
              acting={acting}
            />
          </View>
        </View>
        <BottomTabBar navigation={navigation} isPro activeTab="Manager" transparent />
      </View>
    );
  }

  // Portrait — FlatList couvre tout l'écran, header+stats dans ListHeaderComponent
  return (
    <View style={s.root}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
      <FlatList
        data={loading ? [] : visibleReservations}
        keyExtractor={item => String(item.id)}
        renderItem={renderPortrait}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top }}>
            {header}
            {toolRow}
            {statsMain}
            {statsSecondary}
          </View>
        }
        ListEmptyComponent={
          loading ? <SkeletonComptoir /> : (
            <View style={s.center}>
              <EmptyState icon={<Text style={{ fontSize: 20 }}>📅</Text>} title="Aucune réservation aujourd'hui" subtitle={emptyDateStr} />
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        style={{ flex: 1 }}
      />
      <BottomTabBar navigation={navigation} isPro activeTab="Manager" />
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flex: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  backBtnTxt:  { color: colors.text, fontSize: 20, lineHeight: 24 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  restoName:   { color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading1, letterSpacing: -0.2 },
  dateStr:     { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.caption, textTransform: 'capitalize', marginTop: 1 },
  refreshBtn:  { width: 38, height: 38, backgroundColor: colors.card, borderRadius: 19, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  refreshTxt:  { color: colors.gold, fontSize: 18 },

  // Sélecteur de date + "Plan de salle" — valeurs littérales de Comptoir Reservations.dc.html
  toolRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.md, backgroundColor: colors.card },
  dateSelector:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  dateArrow:      { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  dateArrowTxt:   { fontFamily: typography.bodyMedium, color: colors.textMuted, fontSize: 18 },
  datePill:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.tagNeutralBg, borderRadius: 10, paddingHorizontal: 13, paddingVertical: spacing.sm + 1, flexShrink: 1 },
  datePillTxt:    { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.bodyLg, textTransform: 'capitalize' },
  dateChevron:    { color: colors.textDim, fontSize: 10 },
  planSalleBtn:   { borderWidth: 1.5, borderColor: 'rgba(10,10,10,0.16)', borderRadius: 10, paddingHorizontal: 13, paddingVertical: spacing.sm + 1, alignItems: 'center' },
  planSalleTxt:   { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.caption },
  planSalleSoon:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.xs, marginTop: 1 },

  // 3 cases stats teintées — valeurs littérales (valeur SG700 17px, label DM Sans 500 9.5px)
  statsMain:      { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.card },
  statCard:       { flex: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: spacing.sm, alignItems: 'center' },
  statCardVal:    { fontFamily: typography.display, fontSize: 17, lineHeight: 20 },
  statCardLbl:    { fontFamily: typography.bodyMedium, color: colors.textMuted, fontSize: typography.size.xs + 0.5, marginTop: 3 },

  statsSecondary:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  statsSecondaryItem: { fontFamily: typography.bodyMedium, color: colors.textDim, fontSize: typography.size.xs + 0.5 },
  statsSecondaryDot:  { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textDim },

  landscape:   { flex: 1, flexDirection: 'row' },
  leftPanel:   { width: '35%', overflow: 'hidden', borderRightWidth: 1, borderRightColor: colors.cardBorder },
  rightPanel:  { flex: 1 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  panelTitle:  { fontFamily: typography.bodyBold, color: colors.textDim, fontSize: typography.size.body, letterSpacing: 3 },
  panelCount:  { fontFamily: typography.bodySemibold, color: colors.resa, fontSize: typography.size.heading2 },

  arrivedSep:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.lg },
  arrivedSepLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  arrivedSepTxt:  { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3 },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.section * 3 },
});
