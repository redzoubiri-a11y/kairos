import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Platform, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import FeaturedCard from '../src/components/FeaturedCard';
import ListCard from '../src/components/ListCard';
import useHomeData, { CITIES, CATEGORIES, QUICK_FILTERS } from '../src/hooks/useHomeData';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';

function SectionHead({ label, right, rightAction }) {
  return (
    <View style={sh.row}>
      <View style={sh.left}>
        <View style={sh.bar} />
        <Text style={sh.label}>{label}</Text>
      </View>
      {right && (
        <TouchableOpacity onPress={rightAction}>
          <Text style={sh.right}>{right}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.sm },
  left:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bar:   { width: 3, height: 14, borderRadius: 2, backgroundColor: PRIMARY },
  label: { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 3.5 },
  right: { color: PRIMARY, fontSize: typography.size.body },
});

function SkeletonCard() {
  return (
    <View style={[sk.card, { overflow: 'hidden' }]}>
      <MLoader width="100%" height={200} borderRadius={0} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <MLoader width="40%" height={9} borderRadius={4} />
        <MLoader width="75%" height={16} borderRadius={4} />
        <MLoader width="50%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: { marginHorizontal: spacing.xl, marginBottom: spacing.xl - 4, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder },
});

export default function HomeScreen({ navigation }) {
  usePushNotifications(navigation);
  useDeepLink(navigation);

  const {
    city, setCity,
    category, setCategory,
    restaurants, loading,
    unreadNotifs,
    quickFilter, setQuickFilter,
    featured, filtered, topCount,
    slots, cityObj,
    fadeAnim, slideAnim,
  } = useHomeData();

  const [searchText, setSearchText] = useState('');

  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const goExplorer      = useCallback(() => navigation.navigate('Explorer', { initialCity: city }), [navigation, city]);
  const clearCategory   = useCallback(() => setCategory('all'), []);
  const submitSearch    = useCallback(() => {
    navigation.navigate('Search', { initialQuery: searchText.trim(), initialCity: city });
    setSearchText('');
  }, [navigation, searchText, city]);

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bg} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Chercher un restaurant…"
            placeholderTextColor={colors.textDim}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
          />
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={goNotifications}>
            <Text style={s.iconBtnTxt}>🔔</Text>
            {unreadNotifs > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeTxt}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Cities ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cityRow} contentContainerStyle={s.cityContent}>
        {CITIES.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.cityChip, city === c.id && s.cityChipOn]}
            onPress={() => { setCity(c.id); setCategory('all'); setQuickFilter(null); }}
          >
            <Text style={s.cityEmoji}>{c.emoji}</Text>
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
            {!!c.count && (
              <View style={[s.cityCount, city === c.id && s.cityCountOn]}>
                <Text style={[s.cityCountTxt, city === c.id && s.cityCountTxtOn]}>{c.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Stats bar ── */}
      {!loading && (
        <View style={s.statsBar}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{restaurants.length}</Text>
            <Text style={s.statLabel}> restaurants</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <View style={s.openDotInline} />
            <Text style={s.statGreen}> Tous ouverts</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{topCount}</Text>
            <Text style={s.statLabel}> top notés</Text>
          </View>
        </View>
      )}

      {/* ── Scrollable content ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>

        {/* Ce soir */}
        {slots.length > 0 && (
          <LinearGradient colors={['#1a3460', '#0D1628']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tonightCard}>
            <View style={s.tonightBody}>
              <Text style={s.tonightLabel}>🌙  CE SOIR</Text>
              <Text style={s.tonightTitle}>Trouvez votre table</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.slotRow}>
                {slots.map(slot => (
                  <TouchableOpacity key={slot} style={s.slotChip} onPress={goExplorer}>
                    <Text style={s.slotTxt}>{slot}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.slotChip, s.slotAll]} onPress={goExplorer}>
                  <Text style={s.slotAllTxt}>Voir tout →</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </LinearGradient>
        )}

        {/* À la une */}
        {!loading && featured.length > 0 && (
          <>
            <SectionHead label="À LA UNE" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featRow}>
              {featured.map(r => (
                <FeaturedCard
                  key={r.id} r={r}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                  onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Catégories */}
        <SectionHead
          label="CUISINES"
          right={category !== 'all' ? '✕ Effacer' : null}
          rightAction={clearCategory}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[s.pill, category === cat.id && s.pillOn]} onPress={() => setCategory(cat.id)}>
              <Text style={s.pillEmoji}>{cat.emoji}</Text>
              <Text style={[s.pillTxt, category === cat.id && s.pillTxtOn]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickRow}>
          {QUICK_FILTERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.quickChip, quickFilter === f.id && s.quickChipOn]}
              onPress={() => setQuickFilter(quickFilter === f.id ? null : f.id)}
            >
              <Text style={s.quickEmoji}>{f.emoji}</Text>
              <Text style={[s.quickTxt, quickFilter === f.id && s.quickTxtOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste */}
        <SectionHead
          label={category === 'all' ? 'TOP RESTAURANTS' : (CATEGORIES.find(c => c.id === category)?.label || '').toUpperCase()}
          right={!loading ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}` : null}
        />

        {loading ? (
          <View>
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyTitle}>Aucun restaurant</Text>
            <Text style={s.emptySub}>Essayez une autre catégorie</Text>
            <TouchableOpacity onPress={clearCategory} style={s.emptyBtn}>
              <Text style={s.emptyBtnTxt}>Voir tout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {filtered.map((r, i) => (
              <ListCard
                key={r.id} r={r} rank={i}
                onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
              />
            ))}
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const NAVY        = 'transparent';
const NAVY_BORDER = 'rgba(13,22,40,0.12)';
const PRIMARY     = '#0D1628';
const PRIMARY_SOFT = 'rgba(13,22,40,0.07)';
const CREAM = colors.text;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bg:     { ...StyleSheet.absoluteFillObject, opacity: 0.18 },
  scroll: { flex: 1 },

  /* Header */
  header:        { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  searchBar:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: NAVY, borderRadius: radius.full, borderWidth: 1, borderColor: NAVY_BORDER, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  searchIcon:    { fontSize: 14 },
  searchPlaceholder: { color: colors.textDim, fontSize: 16, fontWeight: '300', letterSpacing: 0.3, flex: 1 },
  searchInput:   { flex: 1, color: colors.text, fontSize: 16, fontWeight: '300', letterSpacing: 0.3, padding: 0 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn:       { width: 38, height: 38, borderRadius: radius.full, backgroundColor: NAVY, borderWidth: 1, borderColor: NAVY_BORDER, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  iconBtnTxt:    { fontSize: 17 },
  notifBadge:    { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  notifBadgeTxt: { color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  /* Cities */
  cityRow:        { maxHeight: 42 },
  cityContent:    { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxs, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  cityChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: NAVY, borderWidth: 1, borderColor: NAVY_BORDER },
  cityChipOn:     { backgroundColor: PRIMARY, borderColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  cityEmoji:      { fontSize: typography.size.body },
  cityTxt:        { color: colors.textMuted, fontSize: typography.size.body },
  cityTxtOn:      { color: '#FFFFFF', fontWeight: typography.weight.semibold },
  cityCount:      { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  cityCountOn:    { backgroundColor: 'rgba(255,255,255,0.22)' },
  cityCountTxt:   { color: colors.textMuted, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  cityCountTxtOn: { color: '#FFFFFF' },

  /* Stats bar */
  statsBar:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginTop: spacing.xs, marginBottom: spacing.xs, backgroundColor: NAVY, borderRadius: radius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderWidth: 1, borderColor: NAVY_BORDER },
  statItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statVal:       { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  statLabel:     { color: colors.textMuted, fontSize: typography.size.caption },
  statGreen:     { color: colors.green, fontSize: typography.size.caption },
  statSep:       { width: 1, height: 18, backgroundColor: NAVY_BORDER },
  openDotInline: { width: 7, height: 7, borderRadius: 0, backgroundColor: colors.green },

  /* Ce soir — chaud éclatant */
  tonightCard:  { marginHorizontal: spacing.xl, marginTop: spacing.md, borderRadius: radius.xl, overflow: 'hidden' },
  tonightBody:  { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  tonightLabel: { color: 'rgba(255,255,255,0.85)', fontSize: typography.size.xs, letterSpacing: 2.5, marginBottom: spacing.xxs, fontWeight: typography.weight.semibold },
  tonightTitle: { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold, marginBottom: spacing.sm },
  slotRow:      { gap: spacing.md },
  slotChip:     { paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: 0, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  slotTxt:      { color: '#FFFFFF', fontSize: typography.size.body, fontWeight: typography.weight.medium },
  slotAll:      { backgroundColor: 'rgba(0,0,0,0.38)', borderColor: 'rgba(255,255,255,0.2)' },
  slotAllTxt:   { color: 'rgba(255,255,255,0.75)', fontSize: typography.size.body },

  /* Featured */
  featRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xs },

  /* Pills cuisine */
  pillRow:   { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.xs },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: NAVY, borderWidth: 1, borderColor: NAVY_BORDER },
  pillOn:    { backgroundColor: PRIMARY, borderColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  pillEmoji: { fontSize: typography.size.subheading },
  pillTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  pillTxtOn: { color: '#FFFFFF', fontWeight: typography.weight.semibold },

  /* Quick filters */
  quickRow:    { paddingHorizontal: spacing.xl, gap: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  quickChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: NAVY, borderWidth: 1, borderColor: NAVY_BORDER },
  quickChipOn: { backgroundColor: PRIMARY_SOFT, borderColor: PRIMARY },
  quickEmoji:  { fontSize: typography.size.body },
  quickTxt:    { color: colors.textMuted, fontSize: typography.size.caption },
  quickTxtOn:  { color: PRIMARY, fontWeight: typography.weight.semibold },

  /* Empty */
  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section + spacing.xxl, gap: spacing.lg },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: CREAM, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg },
  emptyBtn:   { backgroundColor: NAVY, borderRadius: radius.pill, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: NAVY_BORDER, marginTop: spacing.xs },
  emptyBtnTxt:{ color: CREAM, fontSize: typography.size.bodyLg },
});
