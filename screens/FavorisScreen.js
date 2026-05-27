import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator, TextInput,
  RefreshControl, Alert, Dimensions,
} from 'react-native';
import { supabase } from '../supabase';

const SW = Dimensions.get('window').width;
const CARD_W = (SW - 20 * 2 - 10) / 2;

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.3)',
};

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const SORT_OPTIONS = [
  { id: 'recent',  label: 'Récents' },
  { id: 'rating',  label: 'Mieux notés' },
  { id: 'alpha',   label: 'A → Z' },
];

function timeAdded(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Ajouté aujourd'hui";
  if (d === 1) return 'Ajouté hier';
  if (d < 30)  return `Ajouté il y a ${d} j`;
  return `Ajouté le ${new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

/* ─── Card favori ─── */
function FavCard({ fav, index, onPress, onReserve, onRemove, removing }) {
  const r     = fav.restaurants || {};
  const photo = r.photo_url || (r.photos?.[0]) || null;

  return (
    <TouchableOpacity style={fc.card} onPress={onPress} activeOpacity={0.88}>
      {/* Photo */}
      <View style={fc.photoWrap}>
        {photo
          ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e'][index % 5], alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 38, opacity: 0.7 }}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
            </View>
          )
        }

        {/* Gradient overlay */}
        <View style={fc.grad} />

        {/* Rating badge */}
        {r.avg_rating > 0 && (
          <View style={fc.ratingBadge}>
            <Text style={fc.ratingTxt}>★ {Number(r.avg_rating).toFixed(1)}</Text>
          </View>
        )}

        {/* Heart remove */}
        <TouchableOpacity style={fc.heartBtn} onPress={onRemove} disabled={removing}>
          {removing
            ? <ActivityIndicator size={12} color={C.accent} />
            : <Text style={{ fontSize: 14 }}>❤️</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={fc.info}>
        <Text style={fc.cuisine} numberOfLines={1}>
          {(r.cuisine_type || '').replace(/_/g,' ')}
          {r.quartier ? ` · ${r.quartier}` : ''}
        </Text>
        <Text style={fc.name} numberOfLines={1}>{r.name || '—'}</Text>
        <View style={fc.bottom}>
          <Text style={fc.price}>
            {r.avg_ticket > 0 ? `${r.avg_ticket.toLocaleString('fr-FR')} DA` : '—'}
          </Text>
          <TouchableOpacity style={fc.reserveBtn} onPress={onReserve}>
            <Text style={fc.reserveTxt}>Réserver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:        { width: CARD_W, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  photoWrap:   { height: 130, backgroundColor: C.bg3 },
  grad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(20,30,46,0.5)' },
  ratingBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(13,22,40,0.82)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(200,151,90,0.3)' },
  ratingTxt:   { color: C.accent, fontSize: 10, fontWeight: '600' },
  heartBtn:    { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(13,22,40,0.75)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  info:        { padding: 10 },
  cuisine:     { color: C.accent, fontSize: 8, letterSpacing: 1.5, marginBottom: 2, textTransform: 'uppercase' },
  name:        { color: C.text, fontSize: 13, fontWeight: '300', letterSpacing: 0.2, marginBottom: 8 },
  bottom:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:       { color: C.dim, fontSize: 10 },
  reserveBtn:  { backgroundColor: 'rgba(200,151,90,0.15)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.borderAccent },
  reserveTxt:  { color: C.accent, fontSize: 9, fontWeight: '500' },
});

/* ─── Écran principal ─── */
export default function FavorisScreen({ navigation }) {
  const [favorites,  setFavorites]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [removing,   setRemoving]   = useState(new Set());
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('recent');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      supabase.from('users').select('id').eq('auth_id', u.id).single()
        .then(({ data: row }) => { if (row) setUserId(row.id); });
    });
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('id, created_at, restaurant_id, restaurants(id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photo_url, photos, review_count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setFavorites(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const removeFavorite = (fav) => {
    Alert.alert(
      'Retirer des favoris',
      `Retirer ${fav.restaurants?.name || 'ce restaurant'} de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive',
          onPress: async () => {
            setRemoving(prev => new Set(prev).add(fav.id));
            await supabase.from('favorites').delete().eq('id', fav.id);
            setFavorites(prev => prev.filter(f => f.id !== fav.id));
            setRemoving(prev => { const s = new Set(prev); s.delete(fav.id); return s; });
          },
        },
      ]
    );
  };

  /* Filtrage + tri */
  const filtered = favorites
    .filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      const r = f.restaurants || {};
      return (r.name || '').toLowerCase().includes(q)
        || (r.cuisine_type || '').toLowerCase().includes(q)
        || (r.quartier || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'rating') return (b.restaurants?.avg_rating || 0) - (a.restaurants?.avg_rating || 0);
      if (sort === 'alpha')  return (a.restaurants?.name || '').localeCompare(b.restaurants?.name || '');
      return 0; // recent: déjà trié par created_at DESC
    });

  /* Paires pour grille 2 colonnes */
  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push([filtered[i], filtered[i + 1] || null]);
  }

  return (
    <SafeAreaView style={s.root}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>MES PRÉFÉRÉS</Text>
          <Text style={s.headerTitle}>Favoris</Text>
        </View>
        {!loading && favorites.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countTxt}>❤️  {favorites.length}</Text>
          </View>
        )}
      </View>

      {/* Search + Sort */}
      {!loading && favorites.length > 0 && (
        <View style={s.controls}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Chercher dans mes favoris…"
              placeholderTextColor={C.dimmer}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: C.dimmer, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={s.sortBtn}
            onPress={() => setSort(s => {
              const idx = SORT_OPTIONS.findIndex(o => o.id === s);
              return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].id;
            })}
          >
            <Text style={s.sortTxt}>{SORT_OPTIONS.find(o => o.id === sort)?.label}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenu */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
      ) : favorites.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🤍</Text>
          <Text style={s.emptyTitle}>Aucun favori</Text>
          <Text style={s.emptySub}>Appuyez sur ❤️ sur la page d'un restaurant{'\n'}pour l'ajouter ici.</Text>
          <TouchableOpacity style={s.exploreBtn} onPress={() => navigation.navigate('Explorer')}>
            <Text style={s.exploreBtnTxt}>EXPLORER LES RESTAURANTS</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={s.emptyTitle}>Aucun résultat</Text>
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: C.accent2, fontSize: 13 }}>Effacer la recherche</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.accent} />}
        >
          {/* Stat strip */}
          <View style={s.statStrip}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{favorites.length}</Text>
              <Text style={s.statLbl}>Favoris</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>
                {favorites.length > 0
                  ? (favorites.reduce((acc, f) => acc + (f.restaurants?.avg_rating || 0), 0) / favorites.length).toFixed(1)
                  : '—'}
              </Text>
              <Text style={s.statLbl}>Note moy.</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.statItem}>
              <Text style={s.statVal}>
                {[...new Set(favorites.map(f => f.restaurants?.cuisine_type).filter(Boolean))].length}
              </Text>
              <Text style={s.statLbl}>Cuisines</Text>
            </View>
          </View>

          {/* Grille 2 colonnes */}
          {rows.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((fav, ci) => fav ? (
                <FavCard
                  key={fav.id}
                  fav={fav}
                  index={ri * 2 + ci}
                  removing={removing.has(fav.id)}
                  onPress={() => navigation.navigate('Restaurant', { restaurant: fav.restaurants || {} })}
                  onReserve={() => navigation.navigate('ReservationForm', { restaurant: fav.restaurants || {} })}
                  onRemove={() => removeFavorite(fav)}
                />
              ) : (
                <View key="empty" style={{ width: CARD_W }} />
              ))}
            </View>
          ))}

          {/* Derniers ajoutés */}
          <View style={s.recentSection}>
            <Text style={s.recentLabel}>HISTORIQUE DES AJOUTS</Text>
            {[...favorites].slice(0, 5).map(fav => (
              <View key={fav.id} style={s.recentRow}>
                <Text style={s.recentEmoji}>{CUISINE_EMOJI[fav.restaurants?.cuisine_type] || '🍽️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.recentName} numberOfLines={1}>{fav.restaurants?.name || '—'}</Text>
                  <Text style={s.recentTime}>{timeAdded(fav.created_at)}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Restaurant', { restaurant: fav.restaurants || {} })}>
                  <Text style={s.recentArrow}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  headerSub:   { color: C.accent, fontSize: 9, letterSpacing: 3, marginBottom: 2 },
  headerTitle: { color: C.text, fontSize: 28, fontWeight: '300', letterSpacing: 1 },
  countBadge:  { backgroundColor: 'rgba(200,151,90,0.1)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: C.borderAccent },
  countTxt:    { color: C.accent, fontSize: 13, fontWeight: '400' },

  /* Controls */
  controls:    { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  searchBar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bg2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: C.border },
  searchIcon:  { fontSize: 13 },
  searchInput: { flex: 1, color: C.text, fontSize: 13 },
  sortBtn:     { backgroundColor: C.bg2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: C.border, justifyContent: 'center' },
  sortTxt:     { color: C.accent, fontSize: 10, fontWeight: '500' },

  /* Stat strip */
  statStrip:   { flexDirection: 'row', backgroundColor: C.bg2, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginHorizontal: 20, marginBottom: 16 },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  statVal:     { color: C.text, fontSize: 18, fontWeight: '300' },
  statLbl:     { color: C.dimmer, fontSize: 9, letterSpacing: 1 },
  statDiv:     { width: 1, backgroundColor: C.border, marginVertical: 8 },

  /* Grid */
  grid:        { paddingHorizontal: 20, paddingTop: 16 },
  row:         { flexDirection: 'row', gap: 10, marginBottom: 10 },

  /* Recent */
  recentSection:{ marginTop: 8 },
  recentLabel:  { color: C.dimmer, fontSize: 9, letterSpacing: 4, marginBottom: 12 },
  recentRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  recentEmoji:  { fontSize: 22, width: 32, textAlign: 'center' },
  recentName:   { color: C.text, fontSize: 14, fontWeight: '300', marginBottom: 2 },
  recentTime:   { color: C.dimmer, fontSize: 11 },
  recentArrow:  { color: C.dimmer, fontSize: 22, fontWeight: '300' },

  /* Empty */
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  emptyEmoji:  { fontSize: 56 },
  emptyTitle:  { color: C.text, fontSize: 20, fontWeight: '300', letterSpacing: 0.5 },
  emptySub:    { color: C.dim, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  exploreBtn:  { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 24, marginTop: 8 },
  exploreBtnTxt:{ color: C.bg, fontSize: 12, fontWeight: '500', letterSpacing: 2 },
});
