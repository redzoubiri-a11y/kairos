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
import useComptoir from '../src/hooks/useComptoir';
import Clock from '../src/components/Clock';
import ResaRow from '../src/components/ResaRow';
import CompactResaRow from '../src/components/CompactResaRow';
import ResaDetail from '../src/components/ResaDetail';
import BottomTabBar from '../src/components/BottomTabBar';

function StatBox({ label, value, color }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.val, { color }]}>{value}</Text>
      <Text style={sb.lbl}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl - 2 },
  val:  { fontSize: 36, fontWeight: '200', lineHeight: 40 },
  lbl:  { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.xs, letterSpacing: 2, marginTop: 2 },
});

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

  const statsStrip = (
    <View style={s.statsStrip}>
      <StatBox label="TOTAL"      value={total}     color={colors.textMuted} />
      <View style={s.statDiv} />
      <StatBox label="CONFIRMÉES" value={confirmed}  color={colors.green}    />
      <View style={s.statDiv} />
      <StatBox label="EN ATTENTE" value={pending}    color={colors.accent}   />
      <View style={s.statDiv} />
      <StatBox label="ARRIVÉS"    value={arrived}    color={colors.blue}     />
      <View style={s.statDiv} />
      <StatBox label="NO SHOW"    value={no_show}    color='rgba(245,242,236,0.45)'/>
      <View style={s.statDiv} />
      <StatBox label="COUVERTS"   value={covers}     color={colors.accent}   />
    </View>
  );

  if (isLandscape) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
        {header}
        {statsStrip}
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
                <Text style={{ fontSize: 40 }}>📅</Text>
                <Text style={s.emptyTitleSm}>Aucune réservation</Text>
                <Text style={s.emptySub}>{emptyDateStr}</Text>
              </View>
            ) : (
              <FlatList
                data={visibleReservations}
                keyExtractor={item => String(item.id)}
                renderItem={renderCompact}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
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
            {statsStrip}
          </View>
        }
        ListEmptyComponent={
          loading ? <SkeletonComptoir /> : (
            <View style={s.center}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTitle}>Aucune réservation aujourd'hui</Text>
              <Text style={s.emptySub}>{emptyDateStr}</Text>
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        style={{ flex: 1 }}
      />
      <BottomTabBar navigation={navigation} isPro activeTab="Manager" transparent />
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0D1B2A', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.10)' },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flex: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  backBtnTxt:  { color: 'rgba(245,242,236,0.9)', fontSize: 20, lineHeight: 24 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  restoName:   { color: '#F5F2EC', fontSize: typography.size.heading1, fontWeight: '300', letterSpacing: 0.3 },
  dateStr:     { color: 'rgba(245,242,236,0.50)', fontSize: typography.size.caption, textTransform: 'capitalize', marginTop: 1 },
  refreshBtn:  { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  refreshTxt:  { color: '#c8975a', fontSize: 18 },

  statsStrip: { flexDirection: 'row', backgroundColor: '#091420', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  statDiv:    { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: spacing.lg },

  landscape:   { flex: 1, flexDirection: 'row' },
  leftPanel:   { width: '35%', overflow: 'hidden', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  rightPanel:  { flex: 1 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', backgroundColor: '#091420' },
  panelTitle:  { color: 'rgba(245,242,236,0.45)', fontSize: typography.size.body, fontWeight: typography.weight.bold, letterSpacing: 3 },
  panelCount:  { color: '#C87860', fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },

  arrivedSep:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.lg },
  arrivedSepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  arrivedSepTxt:  { color: 'rgba(245,242,236,0.35)', fontSize: typography.size.xs, letterSpacing: 3 },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.section * 3 },
  emptyEmoji:   { fontSize: 72 },
  emptyTitle:   { color: '#F5F2EC', fontSize: 32, fontWeight: '200', letterSpacing: 0.5 },
  emptyTitleSm: { color: '#F5F2EC', fontSize: typography.size.heading2, fontWeight: '300' },
  emptySub:     { color: 'rgba(245,242,236,0.50)', fontSize: 18, fontWeight: '300', textTransform: 'capitalize' },
});
