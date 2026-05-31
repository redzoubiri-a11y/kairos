import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Dimensions, Animated,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import usePushNotifications from '../src/hooks/usePushNotifications';

const SW     = Dimensions.get('window').width;
const CARD_W = SW - 40;
const FEAT_W = SW * 0.78;
const FEAT_H = 260;

const CITIES = [
  { id: 'alger',       label: 'Alger',        emoji: '🏛️', count: '20+' },
  { id: 'oran',        label: 'Oran',          emoji: '🌊', count: '10+' },
  { id: 'constantine', label: 'Constantine',   emoji: '🌉', count: '10+' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou',    emoji: '⛰️', count: '5+'  },
  { id: 'bejaia',      label: 'Béjaïa',        emoji: '🌅', count: '5+'  },
  { id: 'setif',       label: 'Sétif',         emoji: '🌾', count: '5+'  },
  { id: 'annaba',      label: 'Annaba',        emoji: '🌺', count: '5+'  },
  { id: 'tlemcen',     label: 'Tlemcen',       emoji: '🕌', count: '5+'  },
  { id: 'nearby',      label: 'Autour de moi', emoji: '📍', count: ''    },
];

const CATEGORIES = [
  { id: 'all',           label: 'Tout',       emoji: '✦',  cuisine: null            },
  { id: 'algerien',      label: 'Algérien',   emoji: '🥘', cuisine: 'algerien'      },
  { id: 'mediterraneen', label: 'Méditerra.', emoji: '🐟', cuisine: 'mediterraneen' },
  { id: 'francais',      label: 'Français',   emoji: '🍷', cuisine: 'francais'      },
  { id: 'libanais',      label: 'Libanais',   emoji: '🌿', cuisine: 'libanais'      },
];

const QUICK_FILTERS = [
  { id: 'rating', label: 'Top noté',      emoji: '⭐' },
  { id: 'fast',   label: 'Dispo ce soir', emoji: '🌙' },
  { id: 'budget', label: 'Petit budget',  emoji: '💰' },
];

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢', libanais: '🌿', francais: '🍷',
};
const CARD_BG = ['#1A1006', '#0F1006', '#16100A', '#100616', '#060F16', '#160606'];

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return name ? `${g}, ${name} 👋` : g;
}

function eveningSlots() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const all = ['19h00', '19h30', '20h00', '20h30', '21h00', '21h30'];
  if (h >= 22) return [];
  if (h < 17) return all;
  return all.filter(s => {
    const [sh, sm] = s.replace('h', ':').split(':').map(Number);
    return sh > h || (sh === h && sm > m);
  });
}

/* ── Section header ── */
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

/* ── Featured card ── */
function FeaturedCard({ r, onPress, onReserve }) {
  const photo = r.photos?.[0];
  return (
    <TouchableOpacity style={fc.card} onPress={onPress} activeOpacity={0.88}>
      {photo
        ? <Image source={{ uri: photo }} style={fc.photo} resizeMode="cover" />
        : <View style={[fc.photo, { backgroundColor: CARD_BG[0], alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 60 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
          </View>
      }
      <View style={[fc.overlay, { opacity: 0.22 }]} />
      <View style={fc.overlayBottom} />
      <View style={fc.content}>
        <View style={fc.topRow}>
          <View style={fc.openPill}>
            <View style={fc.openDot} />
            <Text style={fc.openTxt}>Ouvert</Text>
          </View>
          {r.avg_rating > 0 && (
            <View style={fc.ratingPill}>
              <Text style={fc.ratingTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={fc.bottom}>
          <Text style={fc.tag}>
            {(r.cuisine_type || '').toUpperCase().replace(/_/g, ' ')}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={fc.name} numberOfLines={1}>{r.name}</Text>
          <View style={fc.footRow}>
            <Text style={fc.price}>
              {r.avg_ticket > 0 ? '~' + r.avg_ticket.toLocaleString('fr-FR') + ' DA' : ''}
            </Text>
            <TouchableOpacity style={fc.resaBtn} onPress={onReserve}>
              <Text style={fc.resaBtnTxt}>Réserver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  card:          { width: FEAT_W, height: FEAT_H, borderRadius: radius.xxl, overflow: 'hidden', marginRight: spacing.xl - 2, backgroundColor: colors.card },
  photo:         { ...StyleSheet.absoluteFillObject },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: FEAT_H * 0.62, backgroundColor: 'rgba(15,13,11,0.88)' },
  content:       { flex: 1, justifyContent: 'space-between', padding: spacing.xl },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  openPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(15,13,11,0.8)', borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(76,175,130,0.4)' },
  openDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:       { color: colors.green, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  ratingPill:    { backgroundColor: 'rgba(15,13,11,0.8)', borderRadius: 100, paddingHorizontal: spacing.lg, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(232,160,69,0.4)' },
  ratingTxt:     { color: colors.accent, fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  bottom:        { gap: 5 },
  tag:           { color: 'rgba(232,160,69,0.8)', fontSize: typography.size.xs, letterSpacing: 2.5, fontWeight: typography.weight.medium },
  name:          { color: colors.text, fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.3 },
  footRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  price:         { color: colors.textMuted, fontSize: typography.size.caption },
  resaBtn:       { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  resaBtnTxt:    { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
});

/* ── List card ── */
function ListCard({ r, rank, onPress, onReserve }) {
  const [idx, setIdx] = useState(0);
  const photos = r.photos?.length > 0 ? r.photos : null;
  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[lc.hero, { backgroundColor: CARD_BG[rank % CARD_BG.length] }]}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / CARD_W))}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: CARD_W, height: 200 }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <Text style={lc.heroEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
        )}
        <View style={lc.heroOverlay} />
        {photos?.length > 1 && (
          <View style={lc.dots}>
            {photos.map((_, i) => <View key={i} style={[lc.dot, i === idx && lc.dotOn]} />)}
          </View>
        )}
        <View style={lc.rankBadge}><Text style={lc.rankTxt}>#{rank + 1}</Text></View>
        {(r.avg_rating || 0) >= 4.5 && (
          <View style={lc.topBadge}><Text style={lc.topBadgeTxt}>⭐ Top</Text></View>
        )}
        <View style={lc.openBadge}>
          <View style={lc.openDot} /><Text style={lc.openTxt}>Ouvert</Text>
        </View>
      </View>
      <View style={lc.body}>
        <View style={lc.bodyTop}>
          <Text style={lc.tag}>
            {(r.cuisine_type || '').toUpperCase().replace(/_/g, ' ')}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={lc.name} numberOfLines={1}>{r.name}</Text>
          <View style={lc.meta}>
            <Text style={lc.ratingVal}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
            {r.review_count > 0 && <Text style={lc.reviews}>({r.review_count} avis)</Text>}
            <View style={lc.dot2} />
            <Text style={lc.price}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
          </View>
        </View>
        <View style={lc.footer}>
          <View style={lc.chips}>
            <View style={lc.chip}><Text style={lc.chipTxt}>📱 En ligne</Text></View>
            <View style={lc.chip}><Text style={lc.chipTxt}>⚡ ~20 min</Text></View>
          </View>
          <TouchableOpacity style={lc.resaBtn} onPress={onReserve}>
            <Text style={lc.resaBtnTxt}>Réserver →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const lc = StyleSheet.create({
  card:        { marginHorizontal: spacing.xl, marginBottom: spacing.xl - 4, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  hero:        { width: CARD_W, height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroEmoji:   { fontSize: 56 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(15,13,11,0.6)' },
  dots:        { position: 'absolute', bottom: spacing.lg, flexDirection: 'row', gap: 4, alignSelf: 'center' },
  dot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn:       { backgroundColor: colors.text, width: 16 },
  rankBadge:   { position: 'absolute', top: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(15,13,11,0.85)', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.cardBorder },
  rankTxt:     { color: colors.textDim, fontSize: typography.size.caption, fontWeight: typography.weight.bold },
  topBadge:    { position: 'absolute', top: spacing.lg, left: spacing.lg, backgroundColor: colors.accentSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(232,160,69,0.35)' },
  topBadgeTxt: { color: colors.accent, fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  openBadge:   { position: 'absolute', bottom: spacing.lg, left: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,13,11,0.85)', borderRadius: 100, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: 5, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  openDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:     { color: colors.green, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  body:        { padding: spacing.xl, gap: spacing.xl - 2 },
  bodyTop:     { gap: spacing.xs },
  tag:         { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 2.5, fontWeight: typography.weight.medium },
  name:        { color: colors.text, fontSize: typography.size.heading2, fontWeight: typography.weight.medium, letterSpacing: 0.2 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingVal:   { color: colors.accent, fontSize: typography.size.body, fontWeight: typography.weight.semibold },
  reviews:     { color: colors.textDim, fontSize: typography.size.caption },
  dot2:        { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textDim },
  price:       { color: colors.textMuted, fontSize: typography.size.body },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips:       { flexDirection: 'row', gap: spacing.sm },
  chip:        { backgroundColor: colors.blueSoft, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(90,155,224,0.2)' },
  chipTxt:     { color: colors.blue, fontSize: typography.size.sm },
  resaBtn:     { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  resaBtnTxt:  { color: colors.bg, fontSize: typography.size.body, fontWeight: typography.weight.bold },
});

/* ── Skeleton list card ── */
function SkeletonCard() {
  return (
    <View style={[lc.card, { overflow: 'hidden' }]}>
      <MLoader width="100%" height={200} borderRadius={0} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <MLoader width="40%" height={9} borderRadius={4} />
        <MLoader width="75%" height={16} borderRadius={4} />
        <MLoader width="50%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

/* ── Écran principal ── */
export default function HomeScreen({ navigation }) {
  usePushNotifications();
  const [city,         setCity]         = useState('alger');
  const [category,     setCategory]     = useState('all');
  const [restaurants,  setRestaurants]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [userName,     setUserName]     = useState('');
  const [userInitial,  setUserInitial]  = useState('?');
  const [avatarUrl,    setAvatarUrl]    = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [quickFilter,  setQuickFilter]  = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      if (u.email) setUserInitial(u.email[0].toUpperCase());

      const { data: row } = await supabase.from('users')
        .select('id, avatar_url, first_name')
        .eq('auth_id', u.id).single();
      if (!row) return;

      setAvatarUrl(row.avatar_url ?? null);
      setUserName(row.first_name || u.email?.split('@')[0] || '');

      const { count } = await supabase.from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', row.id).eq('recipient_type', 'user').eq('is_read', false);
      setUnreadNotifs(count ?? 0);
    })();
  }, []));

  useEffect(() => {
    (async () => {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      let q = supabase.from('restaurants')
        .select('id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,review_count,city')
        .eq('status', 'active').limit(20).order('avg_rating', { ascending: false });
      if (city !== 'nearby') q = q.eq('city', city);
      try {
        const { data } = await q;
        setRestaurants(data ?? []);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
      } finally {
        setLoading(false);
      }
    })();
  }, [city]);

  const featured = useMemo(
    () => [...restaurants].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 6),
    [restaurants],
  );

  const filtered = useMemo(() => {
    const cuisine = CATEGORIES.find(c => c.id === category)?.cuisine;
    let result = category === 'all' ? restaurants : restaurants.filter(r => r.cuisine_type === cuisine);
    if (quickFilter === 'rating') result = [...result].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    if (quickFilter === 'budget') result = [...result].sort((a, b) => (a.avg_ticket || 9999) - (b.avg_ticket || 9999));
    return result;
  }, [restaurants, category, quickFilter]);

  const topCount = useMemo(
    () => restaurants.filter(r => (r.avg_rating || 0) >= 4).length,
    [restaurants],
  );

  const slots   = useMemo(() => eveningSlots(), []);
  const cityObj = useMemo(() => CITIES.find(c => c.id === city) || CITIES[0], [city]);

  const goNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const goProfil        = useCallback(() => navigation.navigate('Profil'), [navigation]);
  const goSearch        = useCallback(() => navigation.navigate('Search'), [navigation]);
  const goExplorer      = useCallback(() => navigation.navigate('Explorer'), [navigation]);
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
      <TouchableOpacity style={s.searchBar} onPress={goSearch} activeOpacity={0.8}>
        <Text style={s.searchIcon}>🔍</Text>
        <Text style={s.searchPlaceholder}>Restaurant, cuisine, quartier…</Text>
        <View style={s.searchCta}><Text style={s.searchCtaTxt}>Chercher</Text></View>
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
  searchBar:         { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginHorizontal: spacing.xl, marginBottom: spacing.md, marginTop: spacing.xs, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: spacing.xl, height: 50 },
  searchIcon:        { fontSize: typography.size.subheading },
  searchPlaceholder: { flex: 1, color: colors.textDim, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
  searchCta:         { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  searchCtaTxt:      { color: colors.bg, fontSize: typography.size.caption, fontWeight: typography.weight.bold },

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
