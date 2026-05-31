import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Animated,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import FeaturedCard from '../src/components/FeaturedCard';
import ListCard from '../src/components/ListCard';
import useHomeData, { CITIES, CATEGORIES, QUICK_FILTERS } from '../src/hooks/useHomeData';
import usePushNotifications from '../src/hooks/usePushNotifications';
import useDeepLink from '../src/hooks/useDeepLink';

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return name ? `${g}, ${name} 👋` : g;
}

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
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.section - 4, marginBottom: spacing.xl },
  left:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bar:   { width: 3, height: 14, borderRadius: 2, backgroundColor: colors.accent },
  label: { color: colors.textDim, fontSize: typography.size.xs, fontWeight: typography.weight.semibold, letterSpacing: 3.5 },
  right: { color: colors.blue, fontSize: typography.size.body },
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
    userName, userInitial, avatarUrl,
    unreadNotifs,
    quickFilter, setQuickFilter,
    featured, filtered, topCount,
    slots, cityObj,
    fadeAnim, slideAnim,
  } = useHomeData();

  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const goProfil        = useCallback(() => navigation.navigate('Profil'), [navigation]);
  const goExplorer      = useCallback(() => navigation.navigate('Explorer', { initialCity: city }), [navigation, city]);
  const clearCategory   = useCallback(() => setCategory('all'), []);

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting(userName)}</Text>
          <View style={s.logoRow}>
            <Text style={s.logo}>mida</Text>
            <View style={s.locationPill}>
              <Text style={s.locationTxt}>{cityObj.emoji}  {cityObj.label}</Text>
            </View>
          </View>
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
          <TouchableOpacity style={s.avatar} onPress={goProfil}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.avatarPhoto} />
              : <Text style={s.avatarTxt}>{userInitial}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      <TouchableOpacity style={s.searchBar} onPress={goExplorer} activeOpacity={0.8}>
        <View style={s.searchSection}>
          <Text style={s.searchSectionIcon}>{cityObj.emoji}</Text>
          <Text style={s.searchSectionTxt} numberOfLines={1}>{cityObj.label}</Text>
        </View>
        <View style={s.searchDiv} />
        <View style={s.searchSection}>
          <Text style={s.searchSectionIcon}>📍</Text>
          <Text style={s.searchSectionTxt}>Quartier</Text>
        </View>
        <View style={s.searchDiv} />
        <View style={s.searchSection}>
          <Text style={s.searchSectionIcon}>🍽️</Text>
          <Text style={s.searchSectionTxt}>Cuisine</Text>
        </View>
        <View style={s.searchCta}><Text style={s.searchCtaTxt}>→</Text></View>
      </TouchableOpacity>

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
          <View style={s.tonightCard}>
            <View style={s.tonightAccentBar} />
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
            <View style={s.tonightRight}>
              <Text style={s.tonightEmoji}>🍽️</Text>
              <Text style={s.tonightCount}>{slots.length} créneaux</Text>
            </View>
          </View>
        )}

        {/* À la une */}
        {!loading && featured.length > 0 && (
          <>
            <SectionHead label="À LA UNE" right="Voir tout →" rightAction={goExplorer} />
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

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },

  /* Header */
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  greeting:      { color: colors.textMuted, fontSize: typography.size.body, fontWeight: typography.weight.regular, marginBottom: 3 },
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  logo:          { color: colors.accent, fontSize: typography.size.title + 4, fontWeight: typography.weight.black, letterSpacing: -1, fontFamily: 'Georgia' },
  locationPill:  { backgroundColor: colors.card, borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  locationTxt:   { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.regular },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  iconBtnTxt:    { fontSize: 17 },
  notifBadge:    { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
  notifBadgeTxt: { color: colors.bg, fontSize: typography.size.xs, fontWeight: typography.weight.bold },
  avatar:        { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:     { color: colors.accent, fontWeight: typography.weight.semibold, fontSize: typography.size.subheading },
  avatarPhoto:   { width: 38, height: 38, borderRadius: 19 },

  /* Search */
  searchBar:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginBottom: spacing.md, marginTop: spacing.xs, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.lg, height: 50, gap: spacing.sm },
  searchSection:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  searchSectionIcon: { fontSize: 13 },
  searchSectionTxt:  { color: colors.textMuted, fontSize: typography.size.body, fontWeight: typography.weight.regular, flex: 1 },
  searchDiv:         { width: 1, height: 22, backgroundColor: colors.cardBorder },
  searchCta:         { backgroundColor: colors.accent, borderRadius: radius.md, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  searchCtaTxt:      { color: colors.bg, fontSize: typography.size.subheading, fontWeight: typography.weight.bold },

  /* Cities */
  cityRow:        { maxHeight: 50 },
  cityContent:    { paddingHorizontal: spacing.xl, paddingVertical: 5, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  cityChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  cityChipOn:     { backgroundColor: colors.accent, borderColor: colors.accent },
  cityEmoji:      { fontSize: typography.size.body },
  cityTxt:        { color: colors.text, fontSize: typography.size.body },
  cityTxtOn:      { color: colors.bg, fontWeight: typography.weight.semibold },
  cityCount:      { backgroundColor: colors.cardBorder, borderRadius: 100, paddingHorizontal: 5, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  cityCountOn:    { backgroundColor: 'rgba(15,13,11,0.25)' },
  cityCountTxt:   { color: colors.textDim, fontSize: typography.size.xs, fontWeight: typography.weight.semibold },
  cityCountTxtOn: { color: 'rgba(15,13,11,0.7)' },

  /* Stats bar */
  statsBar:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl, marginTop: spacing.md, marginBottom: spacing.xs, backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.cardBorder },
  statItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statVal:       { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  statLabel:     { color: colors.textDim, fontSize: typography.size.caption },
  statGreen:     { color: colors.green, fontSize: typography.size.caption },
  statSep:       { width: 1, height: 18, backgroundColor: colors.cardBorder },
  openDotInline: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },

  /* Ce soir */
  tonightCard:      { marginHorizontal: spacing.xl, marginTop: spacing.xxl, borderRadius: radius.xxl, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(232,160,69,0.2)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  tonightAccentBar: { width: 3, alignSelf: 'stretch', backgroundColor: colors.accent },
  tonightBody:      { flex: 1, padding: spacing.xl },
  tonightLabel:     { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 3.5, marginBottom: spacing.xs, fontWeight: typography.weight.semibold },
  tonightTitle:     { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.regular, marginBottom: spacing.lg },
  slotRow:          { gap: spacing.md },
  slotChip:         { paddingHorizontal: spacing.lg, paddingVertical: 7, borderRadius: 100, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(232,160,69,0.3)' },
  slotTxt:          { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.medium },
  slotAll:          { backgroundColor: colors.cardBorder, borderColor: colors.cardBorder },
  slotAllTxt:       { color: colors.textMuted, fontSize: typography.size.body },
  tonightRight:     { paddingRight: spacing.xl, alignItems: 'center', gap: spacing.xs },
  tonightEmoji:     { fontSize: 40 },
  tonightCount:     { color: colors.textMuted, fontSize: typography.size.xs },

  /* Featured */
  featRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xs },

  /* Pills */
  pillRow:   { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.xs },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  pillOn:    { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillEmoji: { fontSize: typography.size.subheading },
  pillTxt:   { color: colors.textMuted, fontSize: typography.size.body },
  pillTxtOn: { color: colors.accent },

  /* Quick filters */
  quickRow:    { paddingHorizontal: spacing.xl, gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  quickChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 100, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  quickChipOn: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  quickEmoji:  { fontSize: typography.size.body },
  quickTxt:    { color: colors.textMuted, fontSize: typography.size.caption },
  quickTxtOn:  { color: colors.blue },

  /* Empty */
  emptyWrap:  { alignItems: 'center', paddingVertical: spacing.section + spacing.xxl, gap: spacing.lg },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg },
  emptyBtn:   { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, marginTop: spacing.xs },
  emptyBtnTxt:{ color: colors.textMuted, fontSize: typography.size.bodyLg },
});
