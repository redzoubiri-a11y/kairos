import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { supabase } from '../supabase';

const SW     = Dimensions.get('window').width;
const CARD_W = SW - 40;
const FEAT_W = SW * 0.78;
const FEAT_H = 260;

const C = {
  bg: '#070e1a', bg2: '#0f1828', bg3: '#162035', bg4: '#1d2a40',
  accent: '#c8975a', accent2: '#4a7fa5', accentSoft: 'rgba(200,151,90,0.12)',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', greenSoft: 'rgba(61,153,112,0.12)',
  red: '#e05a5a', card: '#0f1828',
  border: 'rgba(255,255,255,0.07)', borderAccent: 'rgba(200,151,90,0.3)',
};

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
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
};
const CARD_BG = ['#0d1e0d','#0d1222','#1a1408','#14081a','#081418','#1a0808'];

function formatDate() {
  const d = new Date();
  const DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const MONTHS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return name ? `${g}, ${name} 👋` : g;
}

function eveningSlots() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const all = ['19h00','19h30','20h00','20h30','21h00','21h30'];
  if (h >= 22) return [];
  if (h < 17) return all;
  return all.filter(s => {
    const [sh, sm] = s.replace('h', ':').split(':').map(Number);
    return sh > h || (sh === h && sm > m);
  });
}

/* ─── Section header ─── */
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
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 28, marginBottom: 16 },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar:   { width: 3, height: 14, borderRadius: 2, backgroundColor: C.accent },
  label: { color: C.dimmer, fontSize: 10, fontWeight: '600', letterSpacing: 3.5 },
  right: { color: C.accent2, fontSize: 12 },
});

/* ─── Featured card ─── */
function FeaturedCard({ r, onPress, onReserve }) {
  const photo = r.photos?.[0] || r.photo_url;
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
  card:          { width: FEAT_W, height: FEAT_H, borderRadius: 24, overflow: 'hidden', marginRight: 14, backgroundColor: C.bg3 },
  photo:         { ...StyleSheet.absoluteFillObject },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  overlayBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: FEAT_H * 0.62, backgroundColor: 'rgba(4,9,20,0.88)' },
  content:       { flex: 1, justifyContent: 'space-between', padding: 16 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  openPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(4,9,20,0.8)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.4)' },
  openDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  openTxt:       { color: C.green, fontSize: 10, fontWeight: '500' },
  ratingPill:    { backgroundColor: 'rgba(4,9,20,0.8)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)' },
  ratingTxt:     { color: C.accent, fontSize: 11, fontWeight: '600' },
  bottom:        { gap: 5 },
  tag:           { color: 'rgba(200,151,90,0.8)', fontSize: 9, letterSpacing: 2.5, fontWeight: '500' },
  name:          { color: '#fff', fontSize: 22, fontWeight: '300', letterSpacing: 0.3 },
  footRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price:         { color: 'rgba(240,236,228,0.55)', fontSize: 11 },
  resaBtn:       { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  resaBtnTxt:    { color: '#070e1a', fontSize: 12, fontWeight: '700' },
});

/* ─── List card ─── */
function ListCard({ r, rank, onPress, onReserve }) {
  const [idx, setIdx] = useState(0);
  const photos = r.photos?.length > 0 ? r.photos : r.photo_url ? [r.photo_url] : null;
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
  card:        { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  hero:        { width: CARD_W, height: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroEmoji:   { fontSize: 56 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(4,9,20,0.6)' },
  dots:        { position: 'absolute', bottom: 12, flexDirection: 'row', gap: 4, alignSelf: 'center' },
  dot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn:       { backgroundColor: '#fff', width: 16 },
  rankBadge:   { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(4,9,20,0.85)', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  rankTxt:     { color: C.dimmer, fontSize: 11, fontWeight: '700' },
  topBadge:    { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(200,151,90,0.15)', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(200,151,90,0.35)' },
  topBadgeTxt: { color: C.accent, fontSize: 10, fontWeight: '600' },
  openBadge:   { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(4,9,20,0.85)', borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4, gap: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.3)' },
  openDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  openTxt:     { color: C.green, fontSize: 10, fontWeight: '500' },
  body:        { padding: 16, gap: 14 },
  bodyTop:     { gap: 4 },
  tag:         { color: C.accent, fontSize: 8, letterSpacing: 2.5, fontWeight: '500' },
  name:        { color: C.text, fontSize: 17, fontWeight: '400', letterSpacing: 0.2 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingVal:   { color: C.accent, fontSize: 12, fontWeight: '600' },
  reviews:     { color: C.dimmer, fontSize: 11 },
  dot2:        { width: 3, height: 3, borderRadius: 2, backgroundColor: C.dimmer },
  price:       { color: C.dim, fontSize: 12 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips:       { flexDirection: 'row', gap: 6 },
  chip:        { backgroundColor: 'rgba(74,127,165,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(74,127,165,0.2)' },
  chipTxt:     { color: C.accent2, fontSize: 10 },
  resaBtn:     { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  resaBtnTxt:  { color: '#070e1a', fontSize: 12, fontWeight: '700' },
});

/* ─── Écran principal ─── */
export default function HomeScreen({ navigation }) {
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
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      if (u.email) setUserInitial(u.email[0].toUpperCase());
      supabase.from('users')
        .select('id, avatar_url, first_name')
        .eq('auth_id', u.id).single()
        .then(({ data: row }) => {
          if (!row) return;
          setAvatarUrl(row.avatar_url ?? null);
          setUserName(row.first_name || u.email?.split('@')[0] || '');
          supabase.from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', row.id).eq('recipient_type', 'user').eq('is_read', false)
            .then(({ count }) => setUnreadNotifs(count ?? 0));
        });
    });
  }, []));

  useEffect(() => {
    setLoading(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    let q = supabase.from('restaurants')
      .select('id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,photo_url,review_count,city')
      .eq('status', 'active').limit(20).order('avg_rating', { ascending: false });
    if (city !== 'nearby') q = q.eq('city', city);
    q.then(({ data }) => {
      setRestaurants(data ?? []);
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start();
    });
  }, [city]);

  let filtered = category === 'all'
    ? restaurants
    : restaurants.filter(r => r.cuisine_type === CATEGORIES.find(c => c.id === category)?.cuisine);
  if (quickFilter === 'rating') filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
  if (quickFilter === 'budget') filtered = [...filtered].sort((a, b) => (a.avg_ticket || 9999) - (b.avg_ticket || 9999));

  const featured = [...restaurants].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 6);
  const slots    = eveningSlots();
  const cityObj  = CITIES.find(c => c.id === city) || CITIES[0];
  const topCount = restaurants.filter(r => (r.avg_rating || 0) >= 4).length;

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting(userName)}</Text>
          <View style={s.logoRow}>
            <Text style={s.logo}>MIDA</Text>
            <View style={s.locationPill}>
              <Text style={s.locationTxt}>{cityObj.emoji}  {cityObj.label}</Text>
            </View>
          </View>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={s.iconBtnTxt}>🔔</Text>
            {unreadNotifs > 0 && (
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeTxt}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('Profil')}>
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={s.avatarPhoto} />
              : <Text style={s.avatarTxt}>{userInitial}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search ── */}
      <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
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
                  <TouchableOpacity key={slot} style={s.slotChip} onPress={() => navigation.navigate('Explorer')}>
                    <Text style={s.slotTxt}>{slot}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.slotChip, s.slotAll]} onPress={() => navigation.navigate('Explorer')}>
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
            <SectionHead label="À LA UNE" right="Voir tout →" rightAction={() => navigation.navigate('Explorer')} />
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
          rightAction={() => setCategory('all')}
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
          <View style={s.loadWrap}><ActivityIndicator color={C.accent} size="large" /></View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyTitle}>Aucun restaurant</Text>
            <Text style={s.emptySub}>Essayez une autre catégorie</Text>
            <TouchableOpacity onPress={() => setCategory('all')} style={s.emptyBtn}>
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
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  /* Header */
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  greeting:      { color: C.dim, fontSize: 12, fontWeight: '300', marginBottom: 3 },
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:          { color: C.accent, fontSize: 24, fontWeight: '700', letterSpacing: 6 },
  locationPill:  { backgroundColor: C.bg2, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.borderAccent },
  locationTxt:   { color: C.accent, fontSize: 10, fontWeight: '300' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnTxt:    { fontSize: 17 },
  notifBadge:    { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.bg },
  notifBadgeTxt: { color: C.bg, fontSize: 9, fontWeight: '700' },
  avatar:        { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg3, borderWidth: 1.5, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:     { color: C.accent, fontWeight: '600', fontSize: 14 },
  avatarPhoto:   { width: 38, height: 38, borderRadius: 19 },

  /* Search */
  searchBar:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 10, marginTop: 4, backgroundColor: C.bg2, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 50 },
  searchIcon:        { fontSize: 15 },
  searchPlaceholder: { flex: 1, color: C.dimmer, fontSize: 14, fontWeight: '300' },
  searchCta:         { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  searchCtaTxt:      { color: '#070e1a', fontSize: 11, fontWeight: '700' },

  /* Cities */
  cityRow:        { maxHeight: 50 },
  cityContent:    { paddingHorizontal: 20, paddingVertical: 5, flexDirection: 'row', gap: 8, alignItems: 'center' },
  cityChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  cityChipOn:     { backgroundColor: C.accent, borderColor: C.accent },
  cityEmoji:      { fontSize: 12 },
  cityTxt:        { color: C.text, fontSize: 12 },
  cityTxtOn:      { color: '#070e1a', fontWeight: '600' },
  cityCount:      { backgroundColor: C.bg3, borderRadius: 100, paddingHorizontal: 5, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  cityCountOn:    { backgroundColor: 'rgba(7,14,26,0.25)' },
  cityCountTxt:   { color: C.dimmer, fontSize: 8, fontWeight: '600' },
  cityCountTxtOn: { color: 'rgba(7,14,26,0.7)' },

  /* Stats bar */
  statsBar:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 4, backgroundColor: C.bg2, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border },
  statItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statVal:       { color: C.text, fontSize: 13, fontWeight: '500' },
  statLabel:     { color: C.dimmer, fontSize: 11 },
  statGreen:     { color: C.green, fontSize: 11 },
  statSep:       { width: 1, height: 18, backgroundColor: C.border },
  openDotInline: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },

  /* Ce soir */
  tonightCard:      { marginHorizontal: 20, marginTop: 24, borderRadius: 20, backgroundColor: C.bg2, borderWidth: 1, borderColor: 'rgba(200,151,90,0.2)', overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  tonightAccentBar: { width: 3, alignSelf: 'stretch', backgroundColor: C.accent },
  tonightBody:      { flex: 1, padding: 16 },
  tonightLabel:     { color: C.accent, fontSize: 9, letterSpacing: 3.5, marginBottom: 4, fontWeight: '600' },
  tonightTitle:     { color: C.text, fontSize: 17, fontWeight: '300', marginBottom: 12 },
  slotRow:          { gap: 8 },
  slotChip:         { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(200,151,90,0.1)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)' },
  slotTxt:          { color: C.accent, fontSize: 12, fontWeight: '500' },
  slotAll:          { backgroundColor: C.bg3, borderColor: C.border },
  slotAllTxt:       { color: C.dim, fontSize: 12 },
  tonightRight:     { paddingRight: 16, alignItems: 'center', gap: 4 },
  tonightEmoji:     { fontSize: 40 },
  tonightCount:     { color: C.dim, fontSize: 9 },

  /* Featured */
  featRow: { paddingHorizontal: 20, paddingBottom: 4 },

  /* Pills */
  pillRow:   { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  pillOn:    { backgroundColor: C.accentSoft, borderColor: C.accent },
  pillEmoji: { fontSize: 14 },
  pillTxt:   { color: C.dim, fontSize: 12 },
  pillTxtOn: { color: C.accent },

  /* Quick filters */
  quickRow:    { paddingHorizontal: 20, gap: 8, paddingTop: 10, paddingBottom: 4 },
  quickChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  quickChipOn: { backgroundColor: 'rgba(74,127,165,0.12)', borderColor: C.accent2 },
  quickEmoji:  { fontSize: 12 },
  quickTxt:    { color: C.dim, fontSize: 11 },
  quickTxtOn:  { color: C.accent2 },

  /* Loading / empty */
  loadWrap:   { alignItems: 'center', paddingVertical: 52 },
  emptyWrap:  { alignItems: 'center', paddingVertical: 52, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '300' },
  emptySub:   { color: C.dim, fontSize: 13 },
  emptyBtn:   { backgroundColor: C.bg2, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: C.border, marginTop: 4 },
  emptyBtnTxt:{ color: C.dim, fontSize: 13 },
});
