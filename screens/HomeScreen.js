import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;
const CARD_W    = SW - 40;
const FEAT_W    = SW * 0.78;
const FEAT_H    = 220;

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', card: '#141e2e',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(200,151,90,0.35)',
};

const CITIES = [
  { id: 'alger',       label: 'Alger'         },
  { id: 'oran',        label: 'Oran'           },
  { id: 'constantine', label: 'Constantine'    },
  { id: 'nearby',      label: '📍 Près de moi' },
];

const CATEGORIES = [
  { id: 'all',          label: 'Tout',          emoji: '✦',  bg: '#1a2332', cuisine: null         },
  { id: 'algerien',     label: 'Algérien',      emoji: '🥘', bg: '#1a2e1a', cuisine: 'algerien'   },
  { id: 'mediterraneen',label: 'Méditerranéen', emoji: '🐟', bg: '#1a2a2e', cuisine: 'mediterraneen'},
  { id: 'italien',      label: 'Italien',       emoji: '🍕', bg: '#1a1e2e', cuisine: 'italien'    },
  { id: 'japonais',     label: 'Japonais',      emoji: '🍣', bg: '#2a1a2e', cuisine: 'japonais'   },
  { id: 'turc',         label: 'Turc',          emoji: '🍢', bg: '#2e1a1a', cuisine: 'turc'       },
  { id: 'libanais',     label: 'Libanais',      emoji: '🌿', bg: '#2e2a1a', cuisine: 'libanais'   },
];

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷',
};

const CARD_BG = ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e','#2e1a1a'];

const CITY_BANNERS = {
  alger:       { title: 'Mida 30',       sub: 'Les incontournables d\'Alger',       emoji: '🏆' },
  oran:        { title: 'La Côte',       sub: 'Les meilleures adresses d\'Oran',    emoji: '🌊' },
  constantine: { title: 'Les Ponts',     sub: 'Les tables d\'exception',            emoji: '🌉' },
  nearby:      { title: 'Autour de moi', sub: 'Les tables les plus proches',        emoji: '📍' },
};

function greeting(name) {
  const h = new Date().getHours();
  const label = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  return `${label}${name ? ', ' + name : ''} 👋`;
}

/* ─── Carte featured (grande, carousel) ─── */
function FeaturedCard({ r, onPress }) {
  const photo = r.photos?.[0];
  return (
    <TouchableOpacity style={f.card} onPress={onPress} activeOpacity={0.88}>
      {photo
        ? <Image source={{ uri: photo }} style={f.photo} resizeMode="cover" />
        : <View style={[f.photo, { backgroundColor: '#1a2e1a', alignItems:'center', justifyContent:'center' }]}>
            <Text style={{ fontSize: 52 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
          </View>
      }
      <View style={f.gradient} />
      <View style={f.content}>
        <View style={f.topRow}>
          <View style={f.openPill}>
            <View style={f.openDot} />
            <Text style={f.openTxt}>Ouvert</Text>
          </View>
          <View style={f.ratingPill}>
            <Text style={f.ratingTxt}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
          </View>
        </View>
        <View style={f.bottom}>
          <Text style={f.cuisine}>
            {r.cuisine_type?.toUpperCase()}
            {r.quartier ? '  ·  ' + r.quartier : ''}
          </Text>
          <Text style={f.name} numberOfLines={1}>{r.name}</Text>
          <Text style={f.price}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA / pers.' : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const f = StyleSheet.create({
  card:     { width: FEAT_W, height: FEAT_H, borderRadius: 20, overflow: 'hidden', marginRight: 12, backgroundColor: C.bg3 },
  photo:    { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,14,26,0.55)' },
  content:  { flex: 1, justifyContent: 'space-between', padding: 16 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  openPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(10,15,26,0.7)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(61,153,112,0.35)' },
  openDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  openTxt:  { color: C.green, fontSize: 10 },
  ratingPill: { backgroundColor: 'rgba(10,15,26,0.7)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(200,151,90,0.35)' },
  ratingTxt:  { color: C.accent, fontSize: 11, fontWeight: '500' },
  bottom:   { gap: 3 },
  cuisine:  { color: 'rgba(200,151,90,0.8)', fontSize: 9, letterSpacing: 2 },
  name:     { color: '#fff', fontSize: 18, fontWeight: '400', letterSpacing: 0.3 },
  price:    { color: 'rgba(240,236,228,0.6)', fontSize: 11 },
});

/* ─── Carte liste ─── */
function ListCard({ r, rank, onPress }) {
  const [idx, setIdx] = useState(0);
  const photos = r.photos?.length > 0 ? r.photos : null;
  return (
    <TouchableOpacity style={s.listCard} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.cardHero, { backgroundColor: CARD_BG[rank % CARD_BG.length] }]}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={(e) =>
              setIdx(Math.round(e.nativeEvent.contentOffset.x / CARD_W))
            }
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: CARD_W, height: 180 }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <Text style={s.heroEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
        )}
        <View style={s.heroOverlay} />
        {photos?.length > 1 && (
          <View style={s.heroDots}>
            {photos.map((_, i) => (
              <View key={i} style={[s.heroDot, i === idx && s.heroDotOn]} />
            ))}
          </View>
        )}
        <View style={s.heroRank}><Text style={s.heroRankTxt}>#{rank + 1}</Text></View>
        <View style={s.openBadge}>
          <View style={s.openDot} /><Text style={s.openTxt}>Ouvert</Text>
        </View>
      </View>
      <View style={s.listInfo}>
        <Text style={s.listCuisine}>
          {r.cuisine_type?.toUpperCase()}
          {r.quartier ? '  ·  ' + r.quartier : ''}
        </Text>
        <Text style={s.listName} numberOfLines={1}>{r.name}</Text>
        <View style={s.listMeta}>
          <Text style={s.listRating}>★ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
          <Text style={s.listSep}>·</Text>
          <Text style={s.listPrice}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
        </View>
        <View style={s.listTagRow}>
          <View style={s.listTag}><Text style={s.listTagTxt}>Réservation en ligne</Text></View>
          <View style={s.listTag}><Text style={s.listTagTxt}>~20 min</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

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

  /* User au focus */
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
            .select('id', { count:'exact', head:true })
            .eq('recipient_id', row.id).eq('recipient_type','user').eq('is_read', false)
            .then(({ count }) => setUnreadNotifs(count ?? 0));
        });
    });
  }, []));

  /* Restaurants par ville */
  useEffect(() => {
    setLoading(true);
    let q = supabase.from('restaurants')
      .select('id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,city')
      .eq('status','active').limit(20).order('avg_rating', { ascending: false });
    if (city !== 'nearby') q = q.eq('city', city);
    q.then(({ data }) => { setRestaurants(data ?? []); setLoading(false); });
  }, [city]);

  /* Filtrage par catégorie côté client */
  const filtered = category === 'all'
    ? restaurants
    : restaurants.filter(r => r.cuisine_type === CATEGORIES.find(c => c.id === category)?.cuisine);

  /* Top 3 pour le carousel (meilleure note) */
  const featured = [...restaurants].sort((a, b) => (b.avg_rating||0) - (a.avg_rating||0)).slice(0, 5);

  const banner = CITY_BANNERS[city] || CITY_BANNERS.alger;

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting(userName)}</Text>
          <Text style={s.logo}>MIDA</Text>
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
      </TouchableOpacity>

      {/* ── Villes ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cityRow} contentContainerStyle={s.cityContent}>
        {CITIES.map(c => (
          <TouchableOpacity key={c.id} style={[s.cityChip, city === c.id && s.cityChipOn]} onPress={() => { setCity(c.id); setCategory('all'); }}>
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Contenu scrollable ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>

        {/* Bannière dynamique */}
        <View style={s.banner}>
          <View style={s.bannerInner}>
            <View style={s.bannerBadge}><Text style={s.bannerBadgeTxt}>SÉLECTION MIDA</Text></View>
            <Text style={s.bannerTitle}>{banner.title}</Text>
            <Text style={s.bannerSub}>{banner.sub}</Text>
            <TouchableOpacity style={s.bannerBtn}>
              <Text style={s.bannerBtnTxt}>Découvrir →</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.bannerEmoji}>{banner.emoji}</Text>
        </View>

        {/* ── À la une : carousel featured ── */}
        {!loading && featured.length > 0 && (
          <>
            <View style={s.sectionHead}>
              <Text style={s.sectionLabel}>À LA UNE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featRow}>
              {featured.map(r => (
                <FeaturedCard
                  key={r.id}
                  r={r}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Catégories ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>CUISINES</Text>
          {category !== 'all' && (
            <TouchableOpacity onPress={() => setCategory('all')}>
              <Text style={s.clearFilter}>✕ Effacer</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catCard, category === cat.id && s.catCardOn]}
              onPress={() => setCategory(cat.id)}
            >
              <View style={[s.catImg, { backgroundColor: cat.bg }, category === cat.id && s.catImgOn]}>
                <Text style={s.catEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={[s.catLabel, category === cat.id && s.catLabelOn]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Liste principale ── */}
        <View style={[s.sectionHead, { marginTop: 24 }]}>
          <Text style={s.sectionLabel}>
            {category === 'all' ? 'LES PLUS RÉSERVÉS' : CATEGORIES.find(c=>c.id===category)?.label?.toUpperCase()}
          </Text>
          {!loading && (
            <Text style={s.resultCount}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</Text>
          )}
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={s.loadingTxt}>Chargement…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>🍽️</Text>
            <Text style={s.emptyTitle}>Aucun restaurant</Text>
            <Text style={s.emptySub}>Essayez une autre catégorie ou ville</Text>
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
            />
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:C.bg },
  scroll:       { flex:1 },

  /* Header */
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:10, paddingBottom:10 },
  greeting:     { color:C.dim, fontSize:12, fontWeight:'300', marginBottom:1 },
  logo:         { color:C.accent, fontSize:24, fontWeight:'700', letterSpacing:6 },
  headerRight:  { flexDirection:'row', alignItems:'center', gap:10 },
  iconBtn:      { width:38, height:38, borderRadius:19, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  iconBtnTxt:   { fontSize:17 },
  notifBadge:   { position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:8, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', paddingHorizontal:3, borderWidth:1.5, borderColor:C.bg },
  notifBadgeTxt:{ color:C.bg, fontSize:9, fontWeight:'700' },
  avatar:       { width:38, height:38, borderRadius:19, backgroundColor:C.bg3, borderWidth:1.5, borderColor:C.accent, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  avatarTxt:    { color:C.accent, fontWeight:'600', fontSize:14 },
  avatarPhoto:  { width:38, height:38, borderRadius:19 },

  /* Search */
  searchBar:    { flexDirection:'row', alignItems:'center', gap:10, marginHorizontal:20, marginBottom:10, marginTop:4, backgroundColor:C.bg2, borderRadius:14, borderWidth:1, borderColor:C.border, paddingHorizontal:14, height:46 },
  searchIcon:   { fontSize:15 },
  searchPlaceholder:{ color:C.dimmer, fontSize:14, fontWeight:'300' },

  /* Cities */
  cityRow:      { maxHeight:48 },
  cityContent:  { paddingHorizontal:20, paddingVertical:4, flexDirection:'row', gap:8, alignItems:'center' },
  cityChip:     { paddingHorizontal:18, paddingVertical:7, borderRadius:100, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  cityChipOn:   { backgroundColor:C.accent, borderColor:C.accent },
  cityTxt:      { color:C.dim, fontSize:13, fontWeight:'400' },
  cityTxtOn:    { color:C.bg, fontWeight:'600' },

  /* Banner */
  banner:       { marginHorizontal:20, marginTop:16, borderRadius:18, backgroundColor:C.bg3, borderWidth:1, borderColor:C.borderAccent, padding:22, flexDirection:'row', alignItems:'center' },
  bannerInner:  { flex:1 },
  bannerBadge:  { alignSelf:'flex-start', backgroundColor:'rgba(200,151,90,0.15)', borderRadius:6, paddingHorizontal:8, paddingVertical:3, marginBottom:8, borderWidth:1, borderColor:C.borderAccent },
  bannerBadgeTxt:{ color:C.accent, fontSize:9, fontWeight:'600', letterSpacing:2 },
  bannerTitle:  { color:C.text, fontSize:26, fontWeight:'700', letterSpacing:1 },
  bannerSub:    { color:C.dim, fontSize:12, marginTop:2, marginBottom:14 },
  bannerBtn:    { alignSelf:'flex-start', backgroundColor:C.accent, borderRadius:100, paddingHorizontal:16, paddingVertical:8 },
  bannerBtnTxt: { color:C.bg, fontSize:12, fontWeight:'600' },
  bannerEmoji:  { fontSize:52 },

  /* Section */
  sectionHead:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, marginTop:24, marginBottom:14 },
  sectionLabel: { color:C.dimmer, fontSize:10, fontWeight:'500', letterSpacing:4 },
  resultCount:  { color:C.accent2, fontSize:11 },
  clearFilter:  { color:C.red, fontSize:11 },

  /* Featured */
  featRow:      { paddingHorizontal:20, paddingBottom:4 },

  /* Catégories */
  catRow:       { paddingHorizontal:20, gap:12 },
  catCard:      { alignItems:'center', width:72 },
  catCardOn:    {},
  catImg:       { width:68, height:68, borderRadius:18, alignItems:'center', justifyContent:'center', marginBottom:7, borderWidth:1, borderColor:C.border },
  catImgOn:     { borderColor:C.accent, borderWidth:2 },
  catEmoji:     { fontSize:28 },
  catLabel:     { color:C.dim, fontSize:10, textAlign:'center', lineHeight:13 },
  catLabelOn:   { color:C.accent },

  /* Loading / empty */
  loadingWrap:  { alignItems:'center', paddingVertical:52, gap:12 },
  loadingTxt:   { color:C.dimmer, fontSize:13 },
  emptyWrap:    { alignItems:'center', paddingVertical:52, gap:12 },
  emptyEmoji:   { fontSize:44 },
  emptyTitle:   { color:C.text, fontSize:18, fontWeight:'300' },
  emptySub:     { color:C.dim, fontSize:13, textAlign:'center' },
  emptyBtn:     { backgroundColor:C.bg2, borderRadius:12, paddingHorizontal:20, paddingVertical:10, borderWidth:1, borderColor:C.border, marginTop:4 },
  emptyBtnTxt:  { color:C.dim, fontSize:13 },

  /* List cards */
  listCard:     { marginHorizontal:20, marginBottom:16, backgroundColor:C.card, borderRadius:18, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  cardHero:     { width:CARD_W, height:180, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  heroEmoji:    { fontSize:52 },
  heroOverlay:  { position:'absolute', bottom:0, left:0, right:0, height:60, backgroundColor:'rgba(13,22,40,0.45)' },
  heroDots:     { position:'absolute', bottom:10, flexDirection:'row', gap:4, alignSelf:'center' },
  heroDot:      { width:5, height:5, borderRadius:3, backgroundColor:'rgba(255,255,255,0.4)' },
  heroDotOn:    { backgroundColor:'#fff', width:14 },
  heroRank:     { position:'absolute', top:10, right:10, backgroundColor:'rgba(13,22,40,0.75)', borderRadius:8, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor:C.border },
  heroRankTxt:  { color:C.dimmer, fontSize:11, fontWeight:'600' },
  openBadge:    { position:'absolute', bottom:10, left:10, flexDirection:'row', alignItems:'center', backgroundColor:'rgba(10,15,26,0.82)', borderRadius:100, paddingHorizontal:8, paddingVertical:3, gap:4 },
  openDot:      { width:5, height:5, borderRadius:3, backgroundColor:C.green },
  openTxt:      { color:C.green, fontSize:9 },
  listInfo:     { padding:14 },
  listCuisine:  { color:C.accent, fontSize:8, letterSpacing:2.5, marginBottom:4 },
  listName:     { color:C.text, fontSize:16, fontWeight:'400', letterSpacing:0.3, marginBottom:6 },
  listMeta:     { flexDirection:'row', alignItems:'center', gap:5, marginBottom:8 },
  listRating:   { color:C.accent, fontSize:12, fontWeight:'500' },
  listSep:      { color:C.dimmer, fontSize:12 },
  listPrice:    { color:C.dim, fontSize:12 },
  listTagRow:   { flexDirection:'row', gap:6 },
  listTag:      { backgroundColor:'rgba(74,127,165,0.12)', borderRadius:6, paddingHorizontal:7, paddingVertical:2, borderWidth:1, borderColor:'rgba(74,127,165,0.25)' },
  listTagTxt:   { color:C.accent2, fontSize:9 },
});
