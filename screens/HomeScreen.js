import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';

const SW    = Dimensions.get('window').width;
const CARD_W = SW - 40;
const FEAT_W = SW * 0.76;
const FEAT_H = 240;

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', red: '#e05a5a', card: '#141e2e',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(200,151,90,0.35)',
};

const CITIES = [
  { id: 'alger',       label: 'Alger',       emoji: '🏛️' },
  { id: 'oran',        label: 'Oran',         emoji: '🌊' },
  { id: 'constantine', label: 'Constantine',  emoji: '🌉' },
  { id: 'nearby',      label: 'Autour',       emoji: '📍' },
];

const CATEGORIES = [
  { id: 'all',           label: 'Tout',         emoji: '✦',  cuisine: null           },
  { id: 'algerien',      label: 'Algérien',     emoji: '🥘', cuisine: 'algerien'     },
  { id: 'mediterraneen', label: 'Méditerra.',   emoji: '🐟', cuisine: 'mediterraneen'},
  { id: 'italien',       label: 'Italien',      emoji: '🍕', cuisine: 'italien'      },
  { id: 'japonais',      label: 'Japonais',     emoji: '🍣', cuisine: 'japonais'     },
  { id: 'turc',          label: 'Turc',         emoji: '🍢', cuisine: 'turc'         },
  { id: 'libanais',      label: 'Libanais',     emoji: '🌿', cuisine: 'libanais'     },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
};
const CARD_BG = ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e','#2e1a1a'];

function formatDate() {
  const d = new Date();
  const DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const MONTHS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return name ? `${g}, ${name}` : g;
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

/* ─── Carte featured ─── */
function FeaturedCard({ r, onPress, onReserve }) {
  const photo = r.photos?.[0] || r.photo_url;
  return (
    <TouchableOpacity style={fc.card} onPress={onPress} activeOpacity={0.88}>
      {photo
        ? <Image source={{ uri: photo }} style={fc.photo} resizeMode="cover" />
        : <View style={[fc.photo, { backgroundColor: '#1a2e1a', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 52 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
          </View>
      }
      <View style={fc.overlay} />
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
          <Text style={fc.cuisine}>
            {(r.cuisine_type || '').toUpperCase().replace(/_/g, ' ')}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={fc.name} numberOfLines={1}>{r.name}</Text>
          <View style={fc.footRow}>
            <Text style={fc.price}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : ''}</Text>
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
  card:      { width: FEAT_W, height: FEAT_H, borderRadius: 22, overflow: 'hidden', marginRight: 14, backgroundColor: C.bg3 },
  photo:     { ...StyleSheet.absoluteFillObject },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,14,26,0.28)' },
  content:   { flex: 1, justifyContent: 'space-between', padding: 14 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  openPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(8,14,26,0.75)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(61,153,112,0.4)' },
  openDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  openTxt:   { color: C.green, fontSize: 10 },
  ratingPill:{ backgroundColor: 'rgba(8,14,26,0.75)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(200,151,90,0.4)' },
  ratingTxt: { color: C.accent, fontSize: 11, fontWeight: '500' },
  bottom:    { backgroundColor: 'rgba(8,14,26,0.72)', borderRadius: 14, padding: 12, gap: 4 },
  cuisine:   { color: 'rgba(200,151,90,0.85)', fontSize: 8, letterSpacing: 2.5 },
  name:      { color: '#fff', fontSize: 18, fontWeight: '400', letterSpacing: 0.3 },
  footRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  price:     { color: 'rgba(240,236,228,0.65)', fontSize: 11 },
  resaBtn:   { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  resaBtnTxt:{ color: C.bg, fontSize: 11, fontWeight: '600' },
});

/* ─── Carte liste ─── */
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
              <Image key={i} source={{ uri }} style={{ width: CARD_W, height: 185 }} resizeMode="cover" />
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
        <View style={lc.openBadge}>
          <View style={lc.openDot} /><Text style={lc.openTxt}>Ouvert</Text>
        </View>
      </View>
      <View style={lc.body}>
        <View>
          <Text style={lc.cuisine}>
            {(r.cuisine_type || '').toUpperCase().replace(/_/g, ' ')}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={lc.name} numberOfLines={1}>{r.name}</Text>
          <View style={lc.meta}>
            <Text style={lc.rating}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
            <Text style={lc.sep}>·</Text>
            <Text style={lc.price}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
            {r.review_count > 0 && (
              <><Text style={lc.sep}>·</Text><Text style={lc.reviews}>{r.review_count} avis</Text></>
            )}
          </View>
        </View>
        <View style={lc.footer}>
          <View style={lc.tags}>
            <View style={lc.tag}><Text style={lc.tagTxt}>Résa en ligne</Text></View>
            <View style={lc.tag}><Text style={lc.tagTxt}>~20 min</Text></View>
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
  card:       { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  hero:       { width: CARD_W, height: 185, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroEmoji:  { fontSize: 52 },
  heroOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'rgba(8,14,26,0.5)' },
  dots:       { position: 'absolute', bottom: 10, flexDirection: 'row', gap: 4, alignSelf: 'center' },
  dot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn:      { backgroundColor: '#fff', width: 14 },
  rankBadge:  { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(8,14,26,0.78)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  rankTxt:    { color: C.dimmer, fontSize: 11, fontWeight: '600' },
  openBadge:  { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(8,14,26,0.82)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, gap: 4, borderWidth: 1, borderColor: 'rgba(61,153,112,0.3)' },
  openDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  openTxt:    { color: C.green, fontSize: 9 },
  body:       { padding: 14, gap: 10 },
  cuisine:    { color: C.accent, fontSize: 8, letterSpacing: 2.5, marginBottom: 4 },
  name:       { color: C.text, fontSize: 16, fontWeight: '400', letterSpacing: 0.3, marginBottom: 6 },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rating:     { color: C.accent, fontSize: 12, fontWeight: '500' },
  sep:        { color: C.dimmer },
  price:      { color: C.dim, fontSize: 12 },
  reviews:    { color: C.dimmer, fontSize: 11 },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tags:       { flexDirection: 'row', gap: 6 },
  tag:        { backgroundColor: 'rgba(74,127,165,0.1)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(74,127,165,0.22)' },
  tagTxt:     { color: C.accent2, fontSize: 9 },
  resaBtn:    { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  resaBtnTxt: { color: C.bg, fontSize: 12, fontWeight: '600' },
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
    let q = supabase.from('restaurants')
      .select('id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,photo_url,review_count,city')
      .eq('status', 'active').limit(20).order('avg_rating', { ascending: false });
    if (city !== 'nearby') q = q.eq('city', city);
    q.then(({ data }) => { setRestaurants(data ?? []); setLoading(false); });
  }, [city]);

  const filtered  = category === 'all'
    ? restaurants
    : restaurants.filter(r => r.cuisine_type === CATEGORIES.find(c => c.id === category)?.cuisine);

  const featured  = [...restaurants].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 6);
  const slots     = eveningSlots();
  const cityObj   = CITIES.find(c => c.id === city) || CITIES[0];

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting(userName)}</Text>
          <View style={s.logoRow}>
            <Text style={s.logo}>MIDA</Text>
            <View style={s.datePill}>
              <Text style={s.dateTxt}>{cityObj.emoji}  {formatDate()}</Text>
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

      {/* ── Recherche ── */}
      <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
        <Text style={s.searchIcon}>🔍</Text>
        <Text style={s.searchPlaceholder}>Restaurant, cuisine, quartier…</Text>
        <View style={s.searchCta}><Text style={s.searchCtaTxt}>Chercher</Text></View>
      </TouchableOpacity>

      {/* ── Villes ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cityRow} contentContainerStyle={s.cityContent}>
        {CITIES.map(c => (
          <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => { setCity(c.id); setCategory('all'); }}>
            <Text style={s.cityEmoji}>{c.emoji}</Text>
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Contenu scrollable ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>

        {/* Ce soir */}
        {slots.length > 0 && (
          <View style={s.tonightCard}>
            <View style={s.tonightLeft}>
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
            <Text style={s.tonightEmoji}>🍽️</Text>
          </View>
        )}

        {/* À la une */}
        {!loading && featured.length > 0 && (
          <>
            <View style={s.sectionHead}>
              <Text style={s.sectionLabel}>À LA UNE</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Explorer')}>
                <Text style={s.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featRow}>
              {featured.map(r => (
                <FeaturedCard
                  key={r.id}
                  r={r}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                  onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Catégories */}
        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>CUISINES</Text>
          {category !== 'all' && (
            <TouchableOpacity onPress={() => setCategory('all')}>
              <Text style={s.clearFilter}>✕ Effacer</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.pill, category === cat.id && s.pillOn]}
              onPress={() => setCategory(cat.id)}
            >
              <Text style={s.pillEmoji}>{cat.emoji}</Text>
              <Text style={[s.pillTxt, category === cat.id && s.pillTxtOn]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste */}
        <View style={[s.sectionHead, { marginTop: 8 }]}>
          <Text style={s.sectionLabel}>
            {category === 'all' ? 'TOP RESTAURANTS' : (CATEGORIES.find(c => c.id === category)?.label || '').toUpperCase()}
          </Text>
          {!loading && (
            <Text style={s.resultCount}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</Text>
          )}
        </View>

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
          filtered.map((r, i) => (
            <ListCard
              key={r.id}
              r={r}
              rank={i}
              onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
              onReserve={() => navigation.navigate('ReservationForm', { restaurant: r })}
            />
          ))
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
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  greeting:     { color: C.dim, fontSize: 12, fontWeight: '300', marginBottom: 3 },
  logoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:         { color: C.accent, fontSize: 24, fontWeight: '700', letterSpacing: 6 },
  datePill:     { backgroundColor: C.bg2, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  dateTxt:      { color: C.dim, fontSize: 10, fontWeight: '300' },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnTxt:   { fontSize: 17 },
  notifBadge:   { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.bg },
  notifBadgeTxt:{ color: C.bg, fontSize: 9, fontWeight: '700' },
  avatar:       { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg3, borderWidth: 1.5, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:    { color: C.accent, fontWeight: '600', fontSize: 14 },
  avatarPhoto:  { width: 38, height: 38, borderRadius: 19 },

  /* Search */
  searchBar:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 10, marginTop: 4, backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 50 },
  searchIcon:        { fontSize: 15 },
  searchPlaceholder: { flex: 1, color: C.dimmer, fontSize: 14, fontWeight: '300' },
  searchCta:         { backgroundColor: C.accent, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 5 },
  searchCtaTxt:      { color: C.bg, fontSize: 11, fontWeight: '600' },

  /* Cities */
  cityRow:     { maxHeight: 50 },
  cityContent: { paddingHorizontal: 20, paddingVertical: 5, flexDirection: 'row', gap: 8, alignItems: 'center' },
  cityChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  cityChipOn:  { backgroundColor: C.accent, borderColor: C.accent },
  cityEmoji:   { fontSize: 12 },
  cityTxt:     { color: C.dim, fontSize: 12 },
  cityTxtOn:   { color: C.bg, fontWeight: '600' },

  /* Ce soir */
  tonightCard:  { marginHorizontal: 20, marginTop: 16, borderRadius: 18, backgroundColor: C.bg3, borderWidth: 1, borderColor: 'rgba(200,151,90,0.2)', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tonightLeft:  { flex: 1 },
  tonightLabel: { color: C.accent, fontSize: 10, letterSpacing: 3, marginBottom: 4 },
  tonightTitle: { color: C.text, fontSize: 18, fontWeight: '300', marginBottom: 12 },
  slotRow:      { gap: 8 },
  slotChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(200,151,90,0.1)', borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)' },
  slotTxt:      { color: C.accent, fontSize: 12 },
  slotAll:      { backgroundColor: C.bg2, borderColor: C.border },
  slotAllTxt:   { color: C.dim, fontSize: 12 },
  tonightEmoji: { fontSize: 44 },

  /* Sections */
  sectionHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
  sectionLabel: { color: C.dimmer, fontSize: 10, fontWeight: '500', letterSpacing: 4 },
  seeAll:       { color: C.accent2, fontSize: 12 },
  resultCount:  { color: C.accent2, fontSize: 11 },
  clearFilter:  { color: C.red, fontSize: 11 },

  /* Featured */
  featRow: { paddingHorizontal: 20, paddingBottom: 4 },

  /* Pills */
  pillRow:   { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  pillOn:    { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  pillEmoji: { fontSize: 14 },
  pillTxt:   { color: C.dim, fontSize: 12 },
  pillTxtOn: { color: C.accent },

  /* Loading / empty */
  loadWrap:   { alignItems: 'center', paddingVertical: 52 },
  emptyWrap:  { alignItems: 'center', paddingVertical: 52, gap: 12 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '300' },
  emptySub:   { color: C.dim, fontSize: 13 },
  emptyBtn:   { backgroundColor: C.bg2, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: C.border, marginTop: 4 },
  emptyBtnTxt:{ color: C.dim, fontSize: 13 },
});
