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
  val:  { fontFamily: typography.display, fontSize: 32, fontWeight: typography.weight.bold, lineHeight: 36 },
  lbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 2, marginTop: 2 },
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
      <StatBox label="TOTAL"      value={total}     color={colors.text} />
      <View style={s.statDiv} />
      <StatBox label="CONFIRMÉES" value={confirmed}  color={colors.green}    />
      <View style={s.statDiv} />
      <StatBox label="EN ATTENTE" value={pending}    color={colors.gold}   />
      <View style={s.statDiv} />
      <StatBox label="ARRIVÉS"    value={arrived}    color={colors.blue}     />
      <View style={s.statDiv} />
      <StatBox label="NO SHOW"    value={no_show}    color={colors.textDim}/>
      <View style={s.statDiv} />
      <StatBox label="COUVERTS"   value={covers}     color={colors.text}   />
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
        <BottomTabBar navigation={navigation} isPro activeTab="Manager" />
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
  restoName:   { color: colors.text, fontFamily: typography.display, fontSize: typography.size.heading1, fontWeight: typography.weight.bold, letterSpacing: -0.2 },
  dateStr:     { color: colors.textMuted, fontSize: typography.size.caption, textTransform: 'capitalize', marginTop: 1 },
  refreshBtn:  { width: 38, height: 38, backgroundColor: colors.card, borderRadius: 19, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  refreshTxt:  { color: colors.gold, fontSize: 18 },

  statsStrip: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  statDiv:    { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.lg },

  landscape:   { flex: 1, flexDirection: 'row' },
  leftPanel:   { width: '35%', overflow: 'hidden', borderRightWidth: 1, borderRightColor: colors.cardBorder },
  rightPanel:  { flex: 1 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.cardBorder, backgroundColor: colors.card },
  panelTitle:  { color: colors.textDim, fontSize: typography.size.body, fontWeight: typography.weight.bold, letterSpacing: 3 },
  panelCount:  { color: colors.resa, fontSize: typography.size.heading2, fontWeight: typography.weight.semibold },

  arrivedSep:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, gap: spacing.lg },
  arrivedSepLine: { flex: 1, height: 1, backgroundColor: colors.cardBorder },
  arrivedSepTxt:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 3 },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.section * 3 },
  emptyEmoji:   { fontSize: 72 },
  emptyTitle:   { color: colors.text, fontFamily: typography.display, fontSize: 28, fontWeight: typography.weight.bold, letterSpacing: -0.3 },
  emptyTitleSm: { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium },
  emptySub:     { color: colors.textMuted, fontSize: 16, fontWeight: typography.weight.regular, textTransform: 'capitalize' },
});
