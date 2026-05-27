import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const C = { bg:'#0d1628', bg2:'#111827', bg3:'#1a2332', accent:'#c8975a', accent2:'#4a7fa5', text:'#f0ece4', dim:'#8a9ab0', dimmer:'#4a5568', green:'#3d9970', card:'#141e2e', border:'rgba(255,255,255,0.07)', red:'#e74c3c' };

const STATUS_LABEL = { confirmed:'Confirmée', pending:'En attente', cancelled:'Annulée', arrived:'Arrivé', no_show:'No-show' };
const STATUS_COLOR = { confirmed:C.green, pending:C.accent, cancelled:C.red, arrived:C.accent2, no_show:C.dimmer };

const situations = ['🌙 Diner tranquille','👪 En famille','⚡ Rapide','🌿 Terrasse','💼 Affaires'];
const cuisines   = ['Kabyle','Oriental','Poisson','Grillade','Cafe','Vegetarien'];
const favoris    = [{ name:'Dar Zitoun', emoji:'🥘', note:4.8, bg:'#1a2e1a' },{ name:'La Marine', emoji:'🐟', note:4.9, bg:'#1a1e2e' }];
const settings   = [{ icon:'🔔', label:'Notifications' },{ icon:'📍', label:'Localisation' },{ icon:'🌐', label:'Langue' },{ icon:'🔒', label:'Confidentialite' }];

const CUISINE_EMOJI = { algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕', italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️' };

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
}

function fmtTime(t) {
  if (!t) return '';
  return t.slice(0, 5);
}

export default function ProfilScreen({ navigation }) {
  const [activeTab, setActiveTab]         = useState('profil');
  const [activeSits, setActiveSits]       = useState([0]);
  const [activeCuisines, setActiveCuisines] = useState([0, 2]);
  const [avatarUri, setAvatarUri]         = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [userInitial, setUserInitial]     = useState('?');
  const [userName, setUserName]           = useState('');
  const [userEmail, setUserEmail]         = useState('');
  const [authId, setAuthId]               = useState(null);
  const [userId, setUserId]               = useState(null);
  const [reservations, setReservations]   = useState([]);
  const [resaLoading, setResaLoading]     = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (!u) return;
      setAuthId(u.id);
      setUserEmail(u.email || '');
      setUserInitial((u.email || '?')[0].toUpperCase());
      const meta = u.user_metadata || {};
      setUserName(meta.full_name || meta.name || '');
      supabase.from('users').select('id, avatar_url').eq('auth_id', u.id).single()
        .then(({ data: row }) => {
          if (!row) return;
          if (row.avatar_url) setAvatarUri(row.avatar_url);
          setUserId(row.id);
        });
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setResaLoading(true);
    supabase
      .from('reservations')
      .select('*, restaurants(name, cuisine_type, quartier)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setReservations(data ?? []);
        setResaLoading(false);
      });
  }, [userId]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const ext = uri.split('.').pop().toLowerCase().replace('jpg', 'jpeg');
      const path = `${authId}/avatar.${ext}`;
      const blob = await (await fetch(uri)).blob();
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('auth_id', authId);
      setAvatarUri(publicUrl);
    } catch (e) { console.error('upload avatar', e); }
    finally { setUploading(false); }
  };

  const toggleSit     = (i) => setActiveSits(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  const toggleCuisine = (i) => setActiveCuisines(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight:12 }}>
            <Text style={{ color:C.accent, fontSize:22 }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarImg} />
              : <View style={s.avatar}><Text style={s.avatarTxt}>{userInitial}</Text></View>
            }
            <View style={s.avatarEdit}>
              {uploading ? <ActivityIndicator size={10} color={C.bg} /> : <Text style={{ fontSize:11 }}>📷</Text>}
            </View>
          </TouchableOpacity>
          <View style={{ flex:1 }}>
            <Text style={s.heroName}>{userName || userEmail.split('@')[0] || 'Mon profil'}</Text>
            <Text style={s.heroEmail}>{userEmail}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{reservations.length || '—'}</Text>
            <Text style={s.statLbl}>Réservations</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}><Text style={s.statVal}>3</Text><Text style={s.statLbl}>Favoris</Text></View>
          <View style={s.statDivider} />
          <View style={s.statItem}><Text style={s.statVal}>Alger</Text><Text style={s.statLbl}>Ville</Text></View>
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabs}>
          {['profil','reservations'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabOn]} onPress={() => setActiveTab(t)}>
              <Text style={[s.tabTxt, activeTab === t && s.tabTxtOn]}>
                {t === 'profil' ? 'Profil' : 'Réservations'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab Profil ── */}
        {activeTab === 'profil' && (<>
          <Text style={s.sectionLabel}>MES SITUATIONS</Text>
          <View style={s.chipsWrap}>
            {situations.map((sit, i) => (
              <TouchableOpacity key={i} style={[s.chip, activeSits.includes(i) && s.chipOn]} onPress={() => toggleSit(i)}>
                <Text style={[s.chipTxt, activeSits.includes(i) && s.chipTxtOn]}>{sit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.sectionLabel}>MES CUISINES</Text>
          <View style={s.chipsWrap}>
            {cuisines.map((c, i) => (
              <TouchableOpacity key={i} style={[s.chip, activeCuisines.includes(i) && s.chipOn]} onPress={() => toggleCuisine(i)}>
                <Text style={[s.chipTxt, activeCuisines.includes(i) && s.chipTxtOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.sectionLabel}>MES FAVORIS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft:24, marginBottom:4 }}>
            {favoris.map((r, i) => (
              <TouchableOpacity key={i} style={s.favCard}>
                <View style={[s.favImg, { backgroundColor:r.bg }]}><Text style={{ fontSize:32 }}>{r.emoji}</Text></View>
                <View style={s.favBody}>
                  <Text style={s.favName}>{r.name}</Text>
                  <Text style={s.favNote}>⭐ {r.note}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.sectionLabel}>PARAMÈTRES</Text>
          <View style={s.settingsCard}>
            {settings.map((item, i) => (
              <TouchableOpacity key={i} style={[s.settingItem, i < settings.length - 1 && s.settingBorder]}>
                <Text style={s.settingIcon}>{item.icon}</Text>
                <Text style={s.settingLabel}>{item.label}</Text>
                <Text style={{ color:C.dimmer, fontSize:18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.proBtn} onPress={() => navigation.navigate('ProInscription')}>
            <Text style={s.proBtnIcon}>🍽️</Text>
            <View style={{ flex:1 }}>
              <Text style={s.proBtnTitle}>Je suis restaurateur</Text>
              <Text style={s.proBtnSub}>Rejoignez MIDA Pro et gérez vos réservations</Text>
            </View>
            <Text style={{ color:C.dimmer, fontSize:18 }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={() => supabase.auth.signOut()}>
            <Text style={s.logoutTxt}>Se déconnecter</Text>
          </TouchableOpacity>
        </>)}

        {/* ── Tab Réservations ── */}
        {activeTab === 'reservations' && (<>
          {resaLoading ? (
            <View style={s.empty}><ActivityIndicator color={C.accent} /></View>
          ) : reservations.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyTxt}>Aucune réservation pour l'instant</Text>
            </View>
          ) : (
            reservations.map((r) => {
              const resto = r.restaurants || {};
              const color = STATUS_COLOR[r.status] || C.dimmer;
              return (
                <View key={r.id} style={s.resaCard}>
                  <View style={s.resaLeft}>
                    <Text style={s.resaEmoji}>{CUISINE_EMOJI[resto.cuisine_type] || '🍽️'}</Text>
                  </View>
                  <View style={s.resaBody}>
                    <Text style={s.resaResto} numberOfLines={1}>{resto.name || '—'}</Text>
                    <Text style={s.resaQuartier}>{resto.quartier || ''}</Text>
                    <View style={s.resaMeta}>
                      <Text style={s.resaDate}>📅 {fmtDate(r.date)}</Text>
                      <Text style={s.resaSep}>·</Text>
                      <Text style={s.resaTime}>🕐 {fmtTime(r.time_slot)}</Text>
                      <Text style={s.resaSep}>·</Text>
                      <Text style={s.resaGuests}>👤 {r.nb_adults + (r.nb_children || 0)}</Text>
                    </View>
                  </View>
                  <View style={[s.resaBadge, { borderColor: color }]}>
                    <Text style={[s.resaBadgeTxt, { color }]}>{STATUS_LABEL[r.status] || r.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </>)}

        <View style={{ height:120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:C.bg },
  hero:           { flexDirection:'row', alignItems:'center', gap:16, paddingHorizontal:24, paddingTop:56, paddingBottom:20, borderBottomWidth:1, borderBottomColor:C.border },
  avatarWrap:     { position:'relative' },
  avatarImg:      { width:64, height:64, borderRadius:32, borderWidth:2, borderColor:C.accent },
  avatar:         { width:64, height:64, borderRadius:32, backgroundColor:C.bg3, borderWidth:2, borderColor:C.accent, alignItems:'center', justifyContent:'center' },
  avatarTxt:      { color:C.accent, fontSize:24, fontWeight:'300' },
  avatarEdit:     { position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:11, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:C.bg },
  heroName:       { color:C.text, fontSize:20, fontWeight:'300', letterSpacing:0.5, marginBottom:3 },
  heroEmail:      { color:C.dim, fontSize:12 },
  statsRow:       { flexDirection:'row', paddingHorizontal:24, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  statItem:       { flex:1, alignItems:'center' },
  statVal:        { color:C.accent, fontSize:20, fontWeight:'300', marginBottom:3 },
  statLbl:        { color:C.dimmer, fontSize:10, letterSpacing:2, textTransform:'uppercase' },
  statDivider:    { width:1, backgroundColor:C.border, marginVertical:4 },
  tabs:           { flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.border },
  tab:            { flex:1, paddingVertical:14, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabOn:          { borderBottomColor:C.accent },
  tabTxt:         { color:C.dim, fontSize:13, fontWeight:'300' },
  tabTxtOn:       { color:C.accent, fontWeight:'500' },
  sectionLabel:   { color:C.dimmer, fontSize:10, letterSpacing:5, paddingHorizontal:24, marginTop:24, marginBottom:12, textTransform:'uppercase' },
  chipsWrap:      { flexDirection:'row', flexWrap:'wrap', gap:8, paddingHorizontal:24 },
  chip:           { paddingHorizontal:14, paddingVertical:8, borderRadius:100, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border },
  chipOn:         { backgroundColor:'rgba(200,151,90,0.12)', borderColor:C.accent },
  chipTxt:        { color:C.dim, fontSize:12, fontWeight:'300' },
  chipTxtOn:      { color:C.accent },
  favCard:        { width:140, backgroundColor:C.card, borderRadius:16, overflow:'hidden', marginRight:12, borderWidth:1, borderColor:C.border },
  favImg:         { height:90, alignItems:'center', justifyContent:'center' },
  favBody:        { padding:10 },
  favName:        { color:C.text, fontSize:13, fontWeight:'300', marginBottom:2 },
  favNote:        { color:C.accent, fontSize:11 },
  settingsCard:   { marginHorizontal:24, backgroundColor:C.bg2, borderRadius:16, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  settingItem:    { flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, paddingVertical:14 },
  settingBorder:  { borderBottomWidth:1, borderBottomColor:C.border },
  settingIcon:    { fontSize:18, width:28, textAlign:'center' },
  settingLabel:   { flex:1, color:C.text, fontSize:14, fontWeight:'300' },
  proBtn:         { flexDirection:'row', alignItems:'center', gap:14, marginHorizontal:24, marginTop:16, padding:16, borderRadius:14, backgroundColor:'rgba(200,151,90,0.08)', borderWidth:1, borderColor:'rgba(200,151,90,0.25)' },
  proBtnIcon:     { fontSize:24 },
  proBtnTitle:    { color:C.accent, fontSize:14, fontWeight:'400', marginBottom:2 },
  proBtnSub:      { color:C.dim, fontSize:11, fontWeight:'300' },
  logoutBtn:      { marginHorizontal:24, marginTop:16, padding:14, borderRadius:14, backgroundColor:C.bg2, borderWidth:1, borderColor:C.border, alignItems:'center' },
  logoutTxt:      { color:C.red, fontSize:13, fontWeight:'300' },
  empty:          { alignItems:'center', paddingVertical:60, gap:12 },
  emptyEmoji:     { fontSize:40 },
  emptyTxt:       { color:C.dimmer, fontSize:13 },
  resaCard:       { flexDirection:'row', alignItems:'center', marginHorizontal:24, marginTop:12, backgroundColor:C.card, borderRadius:16, borderWidth:1, borderColor:C.border, padding:14, gap:12 },
  resaLeft:       { width:44, height:44, borderRadius:12, backgroundColor:C.bg2, alignItems:'center', justifyContent:'center' },
  resaEmoji:      { fontSize:22 },
  resaBody:       { flex:1, gap:3 },
  resaResto:      { color:C.text, fontSize:14, fontWeight:'400' },
  resaQuartier:   { color:C.dimmer, fontSize:11 },
  resaMeta:       { flexDirection:'row', alignItems:'center', gap:5, marginTop:2 },
  resaDate:       { color:C.dim, fontSize:11 },
  resaSep:        { color:C.dimmer, fontSize:10 },
  resaTime:       { color:C.dim, fontSize:11 },
  resaGuests:     { color:C.dim, fontSize:11 },
  resaBadge:      { paddingHorizontal:8, paddingVertical:4, borderRadius:8, borderWidth:1 },
  resaBadgeTxt:   { fontSize:10, fontWeight:'500' },
});
