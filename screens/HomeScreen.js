import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { supabase } from '../supabase';

const C = {
  bg: '#0d1628', bg2: '#111827', bg3: '#1a2332',
  accent: '#c8975a', accent2: '#4a7fa5',
  text: '#f0ece4', dim: '#8a9ab0', dimmer: '#4a5568',
  green: '#3d9970', card: '#141e2e',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(200,151,90,0.35)',
};

const CITIES = [
  { id: 'alger',       label: 'Alger' },
  { id: 'oran',        label: 'Oran' },
  { id: 'constantine', label: 'Constantine' },
  { id: 'nearby',      label: '📍 Près de moi' },
];

const FILTERS = [
  '📍 Près de moi',
  '📅 Réserver en ligne',
  'Hydra',
  'Bab El Oued',
  '🕐 Ouvert maintenant',
  '🌿 Terrasse',
];

const CATEGORIES = [
  { id: 'couscous',   label: 'Couscous',     emoji: '🥘', bg: '#1a2e1a' },
  { id: 'grillades',  label: 'Grillades',    emoji: '🔥', bg: '#2e1a1a' },
  { id: 'pizzeria',   label: 'Pizzeria',     emoji: '🍕', bg: '#1a1e2e' },
  { id: 'sandwich',   label: 'Sandwicherie', emoji: '🥙', bg: '#2e2a1a' },
  { id: 'patisserie', label: 'Pâtisserie',  emoji: '🍰', bg: '#2a1a2e' },
  { id: 'mer',        label: 'Fruits de mer',emoji: '🦞', bg: '#1a2a2e' },
];

const CUISINE_EMOJI = {
  algerien: '🥘', mediterraneen: '🐟', fast_casual: '☕',
  italien: '🍕', japonais: '🍣', turc: '🍢',
};

const CARD_BG = ['#1a2e1a', '#1a1e2e', '#2e2a1a', '#2a1a2e', '#1a2a2e', '#2e1a1a'];

export default function HomeScreen({ navigation }) {
  const [city, setCity]               = useState('alger');
  const [activeFilter, setFilter]     = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [userInitial, setUserInitial] = useState("?");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserInitial(data.user.email[0].toUpperCase());
    });
    const t = setTimeout(() => setBannerVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('restaurants').select('*').limit(12);
    if (city !== 'nearby') query = query.eq('city', city);
    query.then(({ data }) => {
      setRestaurants(data ?? []);
      setLoading(false);
    });
  }, [city]);

  const toggleFilter = (f) => setFilter((prev) => (prev === f ? null : f));

  return (
    <SafeAreaView style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.logo}>MIDA</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn}><Text style={s.iconBtnTxt}>🔍</Text></TouchableOpacity>
          <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate("Profil")}><Text style={s.avatarTxt}>{userInitial}</Text></TouchableOpacity>
        </View>
      </View>

      {/* ── City chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.cityRow}
        contentContainerStyle={s.cityContent}
      >
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[s.cityChip, city === c.id && s.cityChipOn]}
            onPress={() => setCity(c.id)}
          >
            <Text style={[s.cityTxt, city === c.id && s.cityTxtOn]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>

        {/* ── Bannière éditoriale ── */}
        <View style={[s.banner, { opacity: bannerVisible ? 1 : 0 }]}>
          <View style={s.bannerInner}>
            <View style={s.bannerBadge}>
              <Text style={s.bannerBadgeTxt}>SÉLECTION</Text>
            </View>
            <Text style={s.bannerTitle}>Mida 30</Text>
            <Text style={s.bannerSub}>Les incontournables d'Alger</Text>
            <TouchableOpacity style={s.bannerBtn}>
              <Text style={s.bannerBtnTxt}>Découvrir →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.bannerDeco}>
            <Text style={s.bannerDecoEmoji}>🏆</Text>
          </View>
        </View>

        {/* ── Filtres horizontaux ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterRow}
          contentContainerStyle={s.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, activeFilter === f && s.filterChipOn]}
              onPress={() => toggleFilter(f)}
            >
              <Text style={[s.filterTxt, activeFilter === f && s.filterTxtOn]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Catégories ── */}
        <View style={s.sectionHead}>
          <Text style={s.sectionLabel}>CATÉGORIES</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={s.catCard}>
              <View style={[s.catImg, { backgroundColor: cat.bg }]}>
                <Text style={s.catEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={s.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Les plus réservés ce soir ── */}
        <View style={[s.sectionHead, s.sectionHeadTop]}>
          <Text style={s.sectionLabel}>LES PLUS RÉSERVÉS CE SOIR</Text>
          <TouchableOpacity><Text style={s.seeAll}>Voir tout</Text></TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.empty}><Text style={s.emptyTxt}>Chargement…</Text></View>
        ) : restaurants.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyTxt}>Aucun restaurant disponible</Text></View>
        ) : (
          restaurants.map((r, i) => (
            <TouchableOpacity
              key={r.id !== undefined ? String(r.id) : String(i)}
              style={s.listCard}
              onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
            >
              <View style={[s.listThumb, { backgroundColor: CARD_BG[i % CARD_BG.length] }]}>
                <Text style={s.listEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                <View style={s.openBadge}>
                  <View style={s.openDot} />
                  <Text style={s.openTxt}>Ouvert</Text>
                </View>
              </View>
              <View style={s.listInfo}>
                <Text style={s.listCuisine}>{r.cuisine_type ? r.cuisine_type.toUpperCase() : '—'}</Text>
                <Text style={s.listName} numberOfLines={1}>{r.name}</Text>
                <View style={s.listMeta}>
                  <Text style={s.listRating}>{'★ ' + (r.rating || '4.8')}</Text>
                  <Text style={s.listSep}>·</Text>
                  <Text style={s.listPrice}>{r.price_range || '1 800 DA'}</Text>
                </View>
                <View style={s.listTagRow}>
                  <View style={s.listTag}><Text style={s.listTagTxt}>Réservation</Text></View>
                  <View style={s.listTag}><Text style={s.listTagTxt}>20 min</Text></View>
                </View>
              </View>
              <View style={s.listRank}>
                <Text style={s.listRankTxt}>{'#' + (i + 1)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={s.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  bottomPad: { height: 120 },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  logo: { color: C.accent, fontSize: 22, fontWeight: '700', letterSpacing: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnTxt: { fontSize: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.accent, fontWeight: '600', fontSize: 14 },

  /* City chips */
  cityRow: { maxHeight: 48 },
  cityContent: { paddingHorizontal: 20, paddingVertical: 4, flexDirection: 'row', gap: 8, alignItems: 'center' },
  cityChip: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  cityChipOn: { backgroundColor: C.accent, borderColor: C.accent },
  cityTxt: { color: C.dim, fontSize: 13, fontWeight: '400' },
  cityTxtOn: { color: '#0d1628', fontWeight: '600' },

  /* Banner */
  banner: { marginHorizontal: 20, marginTop: 16, borderRadius: 18, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.borderAccent, padding: 22, flexDirection: 'row', alignItems: 'center' },
  bannerInner: { flex: 1 },
  bannerBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(200,151,90,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8, borderWidth: 1, borderColor: C.borderAccent },
  bannerBadgeTxt: { color: C.accent, fontSize: 9, fontWeight: '600', letterSpacing: 2 },
  bannerTitle: { color: C.text, fontSize: 26, fontWeight: '700', letterSpacing: 1 },
  bannerSub: { color: C.dim, fontSize: 12, marginTop: 2, marginBottom: 14 },
  bannerBtn: { alignSelf: 'flex-start', backgroundColor: C.accent, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  bannerBtnTxt: { color: '#0d1628', fontSize: 12, fontWeight: '600' },
  bannerDeco: { width: 80, alignItems: 'center', justifyContent: 'center' },
  bannerDecoEmoji: { fontSize: 52 },

  /* Filters */
  filterRow: { marginTop: 16, maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border },
  filterChipOn: { backgroundColor: 'rgba(200,151,90,0.12)', borderColor: C.accent },
  filterTxt: { color: C.dim, fontSize: 12 },
  filterTxtOn: { color: C.accent },

  /* Section head */
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
  sectionHeadTop: { marginTop: 28 },
  sectionLabel: { color: C.dimmer, fontSize: 10, fontWeight: '500', letterSpacing: 4 },
  seeAll: { color: C.accent2, fontSize: 11 },

  /* Categories */
  catContent: { paddingHorizontal: 20, flexDirection: 'row', gap: 12 },
  catCard: { alignItems: 'center', width: 72 },
  catImg: { width: 68, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7, borderWidth: 1, borderColor: C.border },
  catEmoji: { fontSize: 30 },
  catLabel: { color: C.dim, fontSize: 10, textAlign: 'center', lineHeight: 13 },

  /* List cards */
  listCard: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  listThumb: { width: 90, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  listEmoji: { fontSize: 34 },
  openBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10,15,26,0.82)', borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
  openDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  openTxt: { color: C.green, fontSize: 8 },
  listInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  listCuisine: { color: C.accent, fontSize: 8, letterSpacing: 2.5, marginBottom: 3 },
  listName: { color: C.text, fontSize: 15, fontWeight: '400', letterSpacing: 0.3, marginBottom: 4 },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  listRating: { color: C.accent, fontSize: 11, fontWeight: '500' },
  listSep: { color: C.dimmer, fontSize: 11 },
  listPrice: { color: C.dim, fontSize: 11 },
  listTagRow: { flexDirection: 'row', gap: 6 },
  listTag: { backgroundColor: 'rgba(74,127,165,0.12)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(74,127,165,0.25)' },
  listTagTxt: { color: C.accent2, fontSize: 9 },
  listRank: { width: 36, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: C.border },
  listRankTxt: { color: C.dimmer, fontSize: 12, fontWeight: '600' },

  /* Empty */
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: C.dimmer, fontSize: 13 },
});
