import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert, SafeAreaView, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';

const C = {
  bg:'#0d1628', bg2:'#111827', bg3:'#1a2332',
  accent:'#c8975a', accent2:'#4a7fa5',
  text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568',
  green:'#3d9970', red:'#e05a5a', card:'#141e2e',
  border:'rgba(255,255,255,0.07)',
  borderAccent:'rgba(200,151,90,0.25)',
};

const STATUS = {
  confirmed: { label:'Confirmée',  color:C.green  },
  pending:   { label:'En attente', color:C.accent  },
  cancelled: { label:'Annulée',    color:C.red     },
  arrived:   { label:'Arrivé',     color:C.accent2 },
  no_show:   { label:'No-show',    color:C.dimmer  },
};

const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

const CARD_BG = ['#1a2e1a','#1a1e2e','#2e2a1a','#2a1a2e','#1a2a2e','#2e1a1a'];

const SITUATIONS = ['🌙 Dîner tranquille','👪 En famille','⚡ Rapide','🌿 Terrasse','💼 Affaires','🎉 Occasion spéciale'];
const CUISINES   = ['Algérien','Méditerranéen','Italien','Japonais','Turc','Libanais','Français'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
}

/* ─── Stat card ─── */
function StatItem({ value, label }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statVal}>{value ?? '—'}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

export default function ProfilScreen({ navigation }) {
  const [tab,          setTab]          = useState('profil');
  const [authId,       setAuthId]       = useState(null);
  const [userId,       setUserId]       = useState(null);
  const [userEmail,    setUserEmail]    = useState('');
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [city,         setCity]         = useState('');
  const [avatarUri,    setAvatarUri]    = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [editingName,  setEditingName]  = useState(false);
  const [savingName,   setSavingName]   = useState(false);
  const [reservations, setReservations] = useState([]);
  const [resaLoading,  setResaLoading]  = useState(false);
  const [favorites,    setFavorites]    = useState([]);
  const [favLoading,   setFavLoading]   = useState(false);
  const [cancelling,   setCancelling]   = useState(new Set());
  const [activeSits,   setActiveSits]   = useState([]);
  const [activeCuisines, setActiveCuisines] = useState([]);
  const [removing,     setRemoving]     = useState(new Set());

  /* Charge user au mount */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      setAuthId(u.id);
      setUserEmail(u.email || '');
      supabase.from('users')
        .select('id, avatar_url, first_name, last_name, city')
        .eq('auth_id', u.id).single()
        .then(({ data: row }) => {
          if (!row) return;
          setUserId(row.id);
          setAvatarUri(row.avatar_url ?? null);
          setFirstName(row.first_name ?? '');
          setLastName(row.last_name  ?? '');
          setCity(row.city ?? '');
        });
    });
  }, []);

  /* Réservations et favoris au focus */
  useFocusEffect(useCallback(() => {
    if (!userId) return;

    setResaLoading(true);
    supabase.from('reservations')
      .select('*, restaurants(name, cuisine_type, quartier)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => { setReservations(data ?? []); setResaLoading(false); });

    setFavLoading(true);
    supabase.from('favorites')
      .select('id, restaurant_id, restaurants(id, name, cuisine_type, quartier, avg_rating, avg_ticket, photos)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setFavorites(data ?? []); setFavLoading(false); });
  }, [userId]));

  /* Avatar */
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const ext  = uri.split('.').pop().toLowerCase().replace('jpg','jpeg');
      const path = `${authId}/avatar.${ext}`;
      const blob = await (await fetch(uri)).blob();
      await supabase.storage.from('avatars').upload(path, blob, { upsert:true, contentType:`image/${ext}` });
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('users').update({ avatar_url: urlData.publicUrl }).eq('auth_id', authId);
      setAvatarUri(urlData.publicUrl);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  /* Sauvegarder le nom */
  const saveName = async () => {
    setSavingName(true);
    await supabase.from('users')
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq('id', userId);
    setSavingName(false);
    setEditingName(false);
  };

  /* Annuler réservation */
  const cancelResa = (id, restoName) => {
    Alert.alert(
      'Annuler la réservation',
      `Confirmer l'annulation chez ${restoName} ?`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler', style: 'destructive',
          onPress: async () => {
            setCancelling(p => new Set(p).add(id));
            await supabase.from('reservations')
              .update({ status:'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', id);
            setReservations(p => p.map(r => r.id === id ? {...r, status:'cancelled'} : r));
            setCancelling(p => { const s = new Set(p); s.delete(id); return s; });
          },
        },
      ]
    );
  };

  /* Retirer favori */
  const removeFav = async (favId) => {
    setRemoving(p => new Set(p).add(favId));
    await supabase.from('favorites').delete().eq('id', favId);
    setFavorites(p => p.filter(f => f.id !== favId));
    setRemoving(p => { const s = new Set(p); s.delete(favId); return s; });
  };

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'Mon profil';
  const initial     = displayName[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>mon espace</Text>
            <Text style={s.headerTitle}>Profil</Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => setEditingName(v => !v)}>
            <Text style={s.editBtnTxt}>{editingName ? 'Fermer' : '✏️'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Hero avatar ── */}
        <View style={s.heroWrap}>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarImg} />
              : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{initial}</Text></View>
            }
            <View style={s.avatarBadge}>
              {uploading
                ? <ActivityIndicator size={10} color={C.bg} />
                : <Text style={{ fontSize:11 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          {/* Nom éditable */}
          {editingName ? (
            <View style={s.editNameWrap}>
              <View style={s.editRow}>
                <TextInput
                  style={s.editInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Prénom"
                  placeholderTextColor={C.dimmer}
                />
                <TextInput
                  style={s.editInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nom"
                  placeholderTextColor={C.dimmer}
                />
              </View>
              <TouchableOpacity style={s.saveBtn} onPress={saveName} disabled={savingName}>
                {savingName
                  ? <ActivityIndicator size={14} color={C.bg} />
                  : <Text style={s.saveBtnTxt}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{displayName}</Text>
              <Text style={s.heroEmail}>{userEmail}</Text>
              {city ? <Text style={s.heroCity}>📍 {city}</Text> : null}
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.statsCard}>
          <StatItem value={reservations.length} label="Réservations" />
          <View style={s.statDivider} />
          <StatItem value={favorites.length} label="Favoris" />
          <View style={s.statDivider} />
          <StatItem
            value={reservations.filter(r => r.status === 'confirmed').length}
            label="Confirmées"
          />
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabs}>
          {[
            { key:'profil',       label:'Profil'        },
            { key:'reservations', label:'Réservations'  },
            { key:'favoris',      label:'Favoris'       },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, tab === t.key && s.tabOn]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabTxt, tab === t.key && s.tabTxtOn]}>{t.label}</Text>
              {t.key === 'reservations' && reservations.filter(r => r.status === 'pending').length > 0 && (
                <View style={s.tabBadge}>
                  <Text style={s.tabBadgeTxt}>{reservations.filter(r => r.status === 'pending').length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ TAB PROFIL ══ */}
        {tab === 'profil' && (
          <View style={s.tabContent}>

            <Text style={s.sectionLabel}>MES SITUATIONS</Text>
            <View style={s.chipsWrap}>
              {SITUATIONS.map((sit, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, activeSits.includes(i) && s.chipOn]}
                  onPress={() => setActiveSits(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i])}
                >
                  <Text style={[s.chipTxt, activeSits.includes(i) && s.chipTxtOn]}>{sit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>MES CUISINES</Text>
            <View style={s.chipsWrap}>
              {CUISINES.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, activeCuisines.includes(i) && s.chipOn]}
                  onPress={() => setActiveCuisines(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i])}
                >
                  <Text style={[s.chipTxt, activeCuisines.includes(i) && s.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* CTA Pro */}
            <TouchableOpacity style={s.proBtn} onPress={() => navigation.navigate('ProInscription')}>
              <Text style={s.proBtnIcon}>🍽️</Text>
              <View style={{ flex:1 }}>
                <Text style={s.proBtnTitle}>Je suis restaurateur</Text>
                <Text style={s.proBtnSub}>Rejoignez MIDA Pro et gérez vos réservations</Text>
              </View>
              <Text style={s.proBtnArrow}>›</Text>
            </TouchableOpacity>

            {/* Paramètres */}
            <Text style={s.sectionLabel}>COMPTE</Text>
            <View style={s.settingsCard}>
              {[
                { icon:'🔔', label:'Notifications' },
                { icon:'📍', label:'Localisation' },
                { icon:'🌐', label:'Langue' },
                { icon:'🔒', label:'Confidentialité' },
              ].map((item, i, arr) => (
                <TouchableOpacity key={i} style={[s.settingRow, i < arr.length-1 && s.settingBorder]}>
                  <Text style={s.settingIcon}>{item.icon}</Text>
                  <Text style={s.settingLabel}>{item.label}</Text>
                  <Text style={s.settingArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.logoutBtn} onPress={() => supabase.auth.signOut()}>
              <Text style={s.logoutTxt}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══ TAB RÉSERVATIONS ══ */}
        {tab === 'reservations' && (
          <View style={s.tabContent}>
            {resaLoading ? (
              <View style={s.center}><ActivityIndicator color={C.accent} /></View>
            ) : reservations.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>📅</Text>
                <Text style={s.emptyTitle}>Aucune réservation</Text>
                <Text style={s.emptySub}>Vos réservations apparaîtront ici</Text>
              </View>
            ) : (
              reservations.map((r) => {
                const resto = r.restaurants || {};
                const st    = STATUS[r.status] || { label: r.status, color: C.dimmer };
                const isCancelling = cancelling.has(r.id);
                return (
                  <View key={r.id} style={[s.resaCard, { borderLeftWidth:3, borderLeftColor: st.color }]}>
                    <View style={s.resaTop}>
                      <View style={s.resaIconWrap}>
                        <Text style={s.resaIcon}>{CUISINE_EMOJI[resto.cuisine_type] || '🍽️'}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={s.resaName} numberOfLines={1}>{resto.name || '—'}</Text>
                        <Text style={s.resaQuartier}>{resto.quartier || ''}</Text>
                        <View style={s.resaMeta}>
                          <Text style={s.resaMetaTxt}>📅 {fmtDate(r.date)}</Text>
                          <Text style={s.resaDot}>·</Text>
                          <Text style={s.resaMetaTxt}>🕐 {r.time_slot?.slice(0,5)}</Text>
                          <Text style={s.resaDot}>·</Text>
                          <Text style={s.resaMetaTxt}>👥 {(r.nb_adults||0) + (r.nb_children||0)}</Text>
                        </View>
                      </View>
                      <View style={[s.statusBadge, { borderColor: st.color + '60', backgroundColor: st.color + '15' }]}>
                        <Text style={[s.statusBadgeTxt, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                    {!!r.notes && (
                      <View style={s.resaNote}>
                        <Text style={s.resaNoteTxt}>💬  {r.notes}</Text>
                      </View>
                    )}
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <TouchableOpacity
                        style={s.cancelBtn}
                        onPress={() => cancelResa(r.id, resto.name)}
                        disabled={isCancelling}
                      >
                        {isCancelling
                          ? <ActivityIndicator size={12} color={C.red} />
                          : <Text style={s.cancelTxt}>Annuler la réservation</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ══ TAB FAVORIS ══ */}
        {tab === 'favoris' && (
          <View style={s.tabContent}>
            {favLoading ? (
              <View style={s.center}><ActivityIndicator color={C.accent} /></View>
            ) : favorites.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>🤍</Text>
                <Text style={s.emptyTitle}>Aucun favori</Text>
                <Text style={s.emptySub}>Appuyez sur ❤️ sur la page{'\n'}d'un restaurant pour l'ajouter</Text>
              </View>
            ) : (
              favorites.map((fav, i) => {
                const r     = fav.restaurants || {};
                const photo = r.photos?.[0];
                return (
                  <TouchableOpacity
                    key={fav.id}
                    style={s.favCard}
                    onPress={() => navigation.navigate('Restaurant', { restaurant: r })}
                    activeOpacity={0.85}
                  >
                    <View style={[s.favThumb, { backgroundColor: CARD_BG[i % CARD_BG.length] }]}>
                      {photo
                        ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        : <Text style={s.favEmoji}>{CUISINE_EMOJI[r.cuisine_type] || '🍽️'}</Text>
                      }
                    </View>
                    <View style={s.favInfo}>
                      <Text style={s.favCuisine}>
                        {r.cuisine_type?.toUpperCase()}
                        {r.quartier ? '  ·  ' + r.quartier : ''}
                      </Text>
                      <Text style={s.favName} numberOfLines={1}>{r.name}</Text>
                      <View style={s.favMeta}>
                        <Text style={s.favRating}>⭐ {r.avg_rating > 0 ? Number(r.avg_rating).toFixed(1) : '—'}</Text>
                        <Text style={s.favSep}>·</Text>
                        <Text style={s.favPrice}>{r.avg_ticket > 0 ? r.avg_ticket.toLocaleString('fr-FR') + ' DA' : '—'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={s.favRemoveBtn}
                      onPress={() => removeFav(fav.id)}
                      disabled={removing.has(fav.id)}
                    >
                      {removing.has(fav.id)
                        ? <ActivityIndicator size={12} color={C.accent} />
                        : <Text style={s.favRemoveTxt}>❤️</Text>
                      }
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex:1, backgroundColor:C.bg },

  /* Header */
  header:         { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', paddingHorizontal:20, paddingTop:16, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
  backBtn:        { width:36, height:36, borderRadius:18, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  backBtnTxt:     { color:C.text, fontSize:16 },
  headerSub:      { color:C.accent, fontSize:10, fontStyle:'italic', letterSpacing:3, marginBottom:2 },
  headerTitle:    { color:C.text, fontSize:22, fontWeight:'300', letterSpacing:1 },
  editBtn:        { paddingHorizontal:12, paddingVertical:6, borderRadius:10, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  editBtnTxt:     { color:C.dim, fontSize:12 },

  /* Hero */
  heroWrap:       { flexDirection:'row', alignItems:'center', gap:16, paddingHorizontal:20, paddingVertical:20, borderBottomWidth:1, borderBottomColor:C.border },
  avatarWrap:     { position:'relative' },
  avatarImg:      { width:72, height:72, borderRadius:36, borderWidth:2, borderColor:C.accent },
  avatarFallback: { width:72, height:72, borderRadius:36, backgroundColor:C.bg3, borderWidth:2, borderColor:C.accent, alignItems:'center', justifyContent:'center' },
  avatarInitial:  { color:C.accent, fontSize:28, fontWeight:'300' },
  avatarBadge:    { position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:12, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:C.bg },
  heroInfo:       { flex:1 },
  heroName:       { color:C.text, fontSize:20, fontWeight:'300', letterSpacing:0.5, marginBottom:3 },
  heroEmail:      { color:C.dim, fontSize:12, marginBottom:2 },
  heroCity:       { color:C.dimmer, fontSize:11 },

  /* Édition nom */
  editNameWrap:   { flex:1, gap:8 },
  editRow:        { flexDirection:'row', gap:8 },
  editInput:      { flex:1, backgroundColor:C.bg2, borderRadius:10, borderWidth:1, borderColor:C.border, color:C.text, fontSize:13, paddingHorizontal:12, paddingVertical:8 },
  saveBtn:        { backgroundColor:C.accent, borderRadius:10, paddingVertical:9, alignItems:'center' },
  saveBtnTxt:     { color:C.bg, fontSize:13, fontWeight:'500' },

  /* Stats */
  statsCard:      { flexDirection:'row', marginHorizontal:20, marginVertical:14, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  statItem:       { flex:1, alignItems:'center', paddingVertical:14 },
  statVal:        { color:C.accent, fontSize:22, fontWeight:'200', marginBottom:3 },
  statLbl:        { color:C.dimmer, fontSize:9, letterSpacing:1.5 },
  statDivider:    { width:1, backgroundColor:C.border, marginVertical:10 },

  /* Tabs */
  tabs:           { flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.border },
  tab:            { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingVertical:13, borderBottomWidth:2, borderBottomColor:'transparent' },
  tabOn:          { borderBottomColor:C.accent },
  tabTxt:         { color:C.dim, fontSize:13, fontWeight:'300' },
  tabTxtOn:       { color:C.accent, fontWeight:'500' },
  tabBadge:       { width:16, height:16, borderRadius:8, backgroundColor:C.accent, alignItems:'center', justifyContent:'center' },
  tabBadgeTxt:    { color:C.bg, fontSize:9, fontWeight:'700' },

  /* Contenu des tabs */
  tabContent:     { paddingBottom:20 },
  center:         { alignItems:'center', paddingVertical:52, gap:12 },
  emptyEmoji:     { fontSize:44 },
  emptyTitle:     { color:C.text, fontSize:18, fontWeight:'300' },
  emptySub:       { color:C.dim, fontSize:13, textAlign:'center', lineHeight:20 },

  sectionLabel:   { color:C.dimmer, fontSize:9, letterSpacing:3, paddingHorizontal:20, marginTop:22, marginBottom:12 },
  chipsWrap:      { flexDirection:'row', flexWrap:'wrap', gap:8, paddingHorizontal:20 },
  chip:           { paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  chipOn:         { backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent },
  chipTxt:        { color:C.dim, fontSize:12, fontWeight:'300' },
  chipTxtOn:      { color:C.accent },

  /* CTA Pro */
  proBtn:         { flexDirection:'row', alignItems:'center', gap:14, marginHorizontal:20, marginTop:20, padding:16, borderRadius:16, backgroundColor:'rgba(200,151,90,0.07)', borderWidth:1, borderColor:C.borderAccent },
  proBtnIcon:     { fontSize:22 },
  proBtnTitle:    { color:C.accent, fontSize:14, fontWeight:'400', marginBottom:2 },
  proBtnSub:      { color:C.dim, fontSize:11 },
  proBtnArrow:    { color:C.dimmer, fontSize:22 },

  /* Settings */
  settingsCard:   { marginHorizontal:20, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  settingRow:     { flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, paddingVertical:14 },
  settingBorder:  { borderBottomWidth:1, borderBottomColor:C.border },
  settingIcon:    { fontSize:18, width:28, textAlign:'center' },
  settingLabel:   { flex:1, color:C.text, fontSize:14, fontWeight:'300' },
  settingArrow:   { color:C.dimmer, fontSize:20 },

  /* Logout */
  logoutBtn:      { marginHorizontal:20, marginTop:16, paddingVertical:14, borderRadius:14, borderWidth:1, borderColor:'rgba(224,90,90,0.2)', alignItems:'center' },
  logoutTxt:      { color:C.red, fontSize:13 },

  /* Réservations */
  resaCard:       { marginHorizontal:20, marginTop:10, backgroundColor:C.card, borderRadius:14, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  resaTop:        { flexDirection:'row', alignItems:'center', gap:12, padding:14 },
  resaIconWrap:   { width:44, height:44, borderRadius:12, backgroundColor:C.bg2, alignItems:'center', justifyContent:'center' },
  resaIcon:       { fontSize:22 },
  resaName:       { color:C.text, fontSize:14, fontWeight:'400', marginBottom:2 },
  resaQuartier:   { color:C.dimmer, fontSize:10, marginBottom:4 },
  resaMeta:       { flexDirection:'row', alignItems:'center', gap:5 },
  resaMetaTxt:    { color:C.dim, fontSize:11 },
  resaDot:        { color:C.dimmer, fontSize:10 },
  statusBadge:    { paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:1 },
  statusBadgeTxt: { fontSize:9, fontWeight:'600' },
  resaNote:       { backgroundColor:C.bg2, marginHorizontal:14, marginBottom:10, padding:10, borderRadius:10 },
  resaNoteTxt:    { color:C.dim, fontSize:12, lineHeight:18 },
  cancelBtn:      { borderTopWidth:1, borderTopColor:C.border, paddingVertical:11, alignItems:'center' },
  cancelTxt:      { color:C.red, fontSize:12 },

  /* Favoris */
  favCard:        { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:20, marginTop:10, backgroundColor:C.card, borderRadius:14, borderWidth:1, borderColor:C.border, overflow:'hidden', padding:12 },
  favThumb:       { width:58, height:58, borderRadius:12, alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 },
  favEmoji:       { fontSize:26 },
  favInfo:        { flex:1, gap:4 },
  favCuisine:     { color:C.accent, fontSize:9, letterSpacing:2 },
  favName:        { color:C.text, fontSize:14, fontWeight:'300' },
  favMeta:        { flexDirection:'row', alignItems:'center', gap:5 },
  favRating:      { color:C.accent, fontSize:11 },
  favSep:         { color:C.dimmer, fontSize:11 },
  favPrice:       { color:C.dim, fontSize:11 },
  favRemoveBtn:   { width:34, height:34, borderRadius:17, backgroundColor:'rgba(13,22,40,0.6)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.border },
  favRemoveTxt:   { fontSize:15 },
});
