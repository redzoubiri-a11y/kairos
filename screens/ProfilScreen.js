import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import MLoader from '../src/components/MLoader';
import useProfil, { CUISINE_EMOJI, CARD_BG, SITUATIONS, CUISINES } from '../src/hooks/useProfil';
import ProfilResaCard from '../src/components/ProfilResaCard';

function SkeletonResaCard() {
  return (
    <View style={{ marginHorizontal: spacing.xxl, marginTop: spacing.lg }}>
      <MLoader width="100%" height={90} borderRadius={radius.xl} />
    </View>
  );
}

function SkeletonFavRow() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.lg }}>
      <MLoader width={70} height={90} borderRadius={radius.lg} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <MLoader width="40%" height={10} borderRadius={radius.sm} />
        <MLoader width="75%" height={14} borderRadius={radius.sm} />
        <MLoader width="55%" height={10} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export default function ProfilScreen({ navigation }) {
  const {
    tab, setTab,
    userEmail, firstName, setFirstName, lastName, setLastName,
    city, phone, setPhone, memberSince, avatarUri, uploading,
    editingName, savingName,
    reservations, resaLoading, favorites, favLoading,
    cancelling, activeSits, setActiveSits, activeCuisines, setActiveCuisines,
    removing,
    displayName, initial, upcoming, history, pendingCount,
    pickAvatar, saveName, cancelResa, removeFav, signOut, deleteAccount, toggleEditing,
  } = useProfil();

  const confirmDeleteAccount = useCallback(() => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données (réservations, favoris, profil) seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: deleteAccount },
      ]
    );
  }, [deleteAccount]);

  const goBack           = useCallback(() => navigation.goBack(), [navigation]);
  const goProInscription = useCallback(() => navigation.navigate('ProInscription'), [navigation]);
  const goExplorer       = useCallback(() => navigation.navigate('Explorer'), [navigation]);
  const goPrivacy        = useCallback(() => Linking.openURL('app-settings:'), []);
  const goReview         = useCallback(() => Linking.openURL('https://apps.apple.com/app/id6776171199?action=write-review'), []);

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />
      <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={true} keyboardDismissMode="interactive">

        <View style={s.darkTop}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={goBack}>
            <Text style={s.backBtnTxt}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.editBtn} onPress={toggleEditing}>
            <Text style={s.editBtnTxt}>{editingName ? '✕  Fermer' : '✏️  Modifier'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.heroBlock}>
          <Text style={s.heroDeco}>✦</Text>
          <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            <View style={s.avatarRing}>
              <View style={s.avatarClip}>
                {avatarUri
                  ? <Image source={{ uri: avatarUri }} style={s.avatarImg} resizeMode="cover" />
                  : <View style={s.avatarFallback}><Text style={s.avatarInitial}>{initial}</Text></View>
                }
              </View>
            </View>
            <View style={s.avatarBadge}>
              {uploading
                ? <Text style={{ color: colors.bg, fontSize: 10 }}>···</Text>
                : <Text style={{ fontSize: 11 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          {editingName ? (
            <View style={s.editBlock}>
              <View style={s.editRow}>
                <TextInput style={s.editInput} value={firstName} onChangeText={setFirstName} placeholder="Prénom" placeholderTextColor={colors.textDim} />
                <TextInput style={s.editInput} value={lastName}  onChangeText={setLastName}  placeholder="Nom"    placeholderTextColor={colors.textDim} />
              </View>
              <TextInput
                style={[s.editInput, { width: '100%' }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+213 6XX XXX XXX"
                placeholderTextColor={colors.textDim}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={s.saveBtn} onPress={saveName} disabled={savingName}>
                <Text style={s.saveBtnTxt}>{savingName ? '···' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{displayName}</Text>
              <Text style={s.heroEmail}>{userEmail}</Text>
              {!!city        && <Text style={s.heroCity}>📍 {city}</Text>}
              {!!phone       && <Text style={s.heroCity}>📞 {phone}</Text>}
              {!!memberSince && <Text style={s.heroMember}>Membre depuis {memberSince}</Text>}
            </View>
          )}
        </View>
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{reservations.length}</Text>
            <Text style={s.statLbl}>RÉSERVATIONS</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={[s.statVal, upcoming.length > 0 && { color: colors.green }]}>{upcoming.length}</Text>
            <Text style={s.statLbl}>À VENIR</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{favorites.length}</Text>
            <Text style={s.statLbl}>FAVORIS</Text>
          </View>
        </View>

        <View style={s.tabWrap}>
          {[
            { key:'profil',       label:'Profil'        },
            { key:'reservations', label:'Réservations'  },
            { key:'favoris',      label:'Favoris'       },
          ].map(t => (
            <TouchableOpacity key={t.key} style={[s.tabBtn, tab === t.key && s.tabBtnOn]} onPress={() => setTab(t.key)}>
              <Text style={[s.tabTxt, tab === t.key && s.tabTxtOn]}>{t.label}</Text>
              {t.key === 'reservations' && pendingCount > 0 && (
                <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{pendingCount}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ══ PROFIL ══ */}
        {tab === 'profil' && (
          <View>
            <Text style={s.sectionLbl}>MES OCCASIONS PRÉFÉRÉES</Text>
            <View style={s.chipsWrap}>
              {SITUATIONS.map((sit, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, activeSits.includes(i) && s.chipOn]}
                  onPress={() => setActiveSits(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                >
                  <Text style={[s.chipTxt, activeSits.includes(i) && s.chipTxtOn]}>{sit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLbl}>MES CUISINES PRÉFÉRÉES</Text>
            <View style={s.chipsWrap}>
              {CUISINES.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.chip, activeCuisines.includes(i) && s.chipOn]}
                  onPress={() => setActiveCuisines(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])}
                >
                  <Text style={[s.chipTxt, activeCuisines.includes(i) && s.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.proCard} onPress={goProInscription}>
              <View style={s.proCardIcon}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.proCardTitle}>DEVENIR PARTENAIRE</Text>
                <Text style={s.proCardSub}>{'Rejoignez MIDA Pro\nGérez vos réservations'}</Text>
              </View>
              <Text style={s.proCardArrow}>›</Text>
            </TouchableOpacity>

            <Text style={s.sectionLbl}>COMPTE</Text>
            <View style={s.settingsCard}>
              {[
                { icon:'⚙️', label:'Paramètres',             screen:'Settings'  },
                { icon:'❓', label:'Aide & Support',          screen:'Aide'      },
                { icon:'🔔', label:'Notifications',          screen:'Notifications' },
                { icon:'🔒', label:'Confidentialité',        action: goPrivacy  },
                { icon:'⭐', label:'Donner un avis sur MIDA', action: goReview  },
              ].map((item, i, arr) => (
                <TouchableOpacity key={i} style={[s.settingRow, i < arr.length - 1 && s.settingBorder]} onPress={() => item.action ? item.action() : item.screen && navigation.navigate(item.screen)}>
                  <View style={s.settingIconWrap}><Text style={s.settingIcon}>{item.icon}</Text></View>
                  <Text style={s.settingLabel}>{item.label}</Text>
                  <Text style={s.settingArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
              <Text style={s.signOutTxt}>Se déconnecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteAccountBtn} onPress={confirmDeleteAccount}>
              <Text style={s.deleteAccountTxt}>Supprimer mon compte</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </View>
        )}

        {/* ══ RÉSERVATIONS ══ */}
        {tab === 'reservations' && (
          <View>
            {resaLoading ? (
              <View>{[1, 2, 3].map(i => <SkeletonResaCard key={i} />)}</View>
            ) : reservations.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>📅</Text>
                <Text style={s.emptyTitle}>Aucune réservation</Text>
                <Text style={s.emptySub}>Vos réservations apparaîtront ici</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={goExplorer}>
                  <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <>
                    <Text style={s.sectionLbl}>À VENIR  ·  {upcoming.length}</Text>
                    {upcoming.map(r => (
                      <ProfilResaCard key={r.id} r={r} cancelling={cancelling} onCancel={cancelResa} />
                    ))}
                  </>
                )}
                {history.length > 0 && (
                  <>
                    <Text style={s.sectionLbl}>HISTORIQUE  ·  {history.length}</Text>
                    {history.map(r => (
                      <ProfilResaCard
                        key={r.id} r={r} cancelling={cancelling} onCancel={cancelResa}
                        onReserveAgain={r.restaurants?.id ? () => navigation.navigate('ReservationForm', { restaurant: r.restaurants }) : undefined}
                      />
                    ))}
                  </>
                )}
              </>
            )}
            <View style={{ height: 40 }} />
          </View>
        )}

        {/* ══ FAVORIS ══ */}
        {tab === 'favoris' && (
          <View>
            {favLoading ? (
              <View>{[1, 2, 3].map(i => <SkeletonFavRow key={i} />)}</View>
            ) : favorites.length === 0 ? (
              <View style={s.center}>
                <Text style={s.emptyEmoji}>🤍</Text>
                <Text style={s.emptyTitle}>Aucun favori</Text>
                <Text style={s.emptySub}>Appuyez sur ❤️ sur la page{'\n'}d'un restaurant pour l'ajouter</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={goExplorer}>
                  <Text style={s.emptyBtnTxt}>Explorer les restaurants →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.sectionLbl}>
                  {favorites.length} RESTAURANT{favorites.length > 1 ? 'S' : ''} SAUVEGARDÉ{favorites.length > 1 ? 'S' : ''}
                </Text>
                {favorites.map((fav, i) => {
                  const r = fav.restaurants || {};
                  const photo = r.photos?.[0] || r.photo_url;
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
                      <View style={s.favBody}>
                        <Text style={s.favCuisine}>
                          {(r.cuisine_type||'').toUpperCase().replace(/_/g,' ')}
                          {r.quartier ? '  ·  '+r.quartier : ''}
                        </Text>
                        <Text style={s.favName} numberOfLines={1}>{r.name}</Text>
                        <View style={s.favMeta}>
                          {r.avg_rating > 0 && <Text style={s.favRating}>★ {Number(r.avg_rating).toFixed(1)}</Text>}
                          {r.avg_ticket > 0 && <><Text style={s.favSep}>·</Text><Text style={s.favPrice}>{r.avg_ticket.toLocaleString('fr-FR')} DA</Text></>}
                        </View>
                        <TouchableOpacity
                          style={s.favResaBtn}
                          onPress={() => navigation.navigate('ReservationForm', { restaurant: r })}
                        >
                          <Text style={s.favResaBtnTxt}>Réserver →</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={s.favHeart} onPress={() => removeFav(fav.id)} disabled={removing.has(fav.id)}>
                        <Text style={s.favHeartTxt}>{removing.has(fav.id) ? '···' : '❤️'}</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            <View style={{ height: 40 }} />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  darkTop:     { backgroundColor: '#006233' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  backBtn:     { width: 36, height: 36, borderRadius: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  backBtnTxt:  { color: '#FFFFFF', fontSize: typography.size.heading2 },
  editBtn:     { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  editBtnTxt:  { color: 'rgba(255,255,255,0.85)', fontSize: typography.size.caption },

  heroBlock:     { alignItems: 'center', paddingTop: 28, paddingBottom: 28, paddingHorizontal: spacing.xxl, overflow: 'hidden' },
  heroDeco:      { position: 'absolute', top: -30, color: 'rgba(255,255,255,0.06)', fontSize: 220, fontWeight: '700' },
  avatarWrap:    { position: 'relative', marginBottom: spacing.lg },
  avatarRing:    { width: 104, height: 104, borderRadius: 52, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  avatarClip:    { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  avatarImg:     { width: 96, height: 96 },
  avatarFallback:{ width: 96, height: 96, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#FFFFFF', fontSize: 36, fontWeight: typography.weight.regular },
  avatarBadge:   { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#006233' },
  heroInfo:      { alignItems: 'center', gap: spacing.sm },
  heroName:      { color: '#F5F2EC', fontSize: typography.size.title, fontWeight: typography.weight.regular, letterSpacing: 0.5 },
  heroEmail:     { color: 'rgba(245,242,236,0.65)', fontSize: typography.size.bodyLg },
  heroCity:      { color: 'rgba(245,242,236,0.50)', fontSize: typography.size.body },
  heroMember:    { color: 'rgba(245,242,236,0.40)', fontSize: typography.size.sm, letterSpacing: 1, marginTop: 2 },
  editBlock:     { width: '100%', gap: spacing.lg },
  editRow:       { flexDirection: 'row', gap: spacing.lg },
  editInput:     { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, color: colors.text, fontSize: typography.size.subheading, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  saveBtn:       { backgroundColor: '#004d27', borderRadius: radius.lg, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  saveBtnTxt:    { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },

  statsRow: { flexDirection: 'row', marginHorizontal: spacing.xxl, marginVertical: spacing.xl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
  statVal:  { color: '#C87860', fontSize: typography.size.title, fontWeight: typography.weight.regular, marginBottom: spacing.xs },
  statLbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5 },
  statDiv:  { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.lg },

  tabWrap:    { flexDirection: 'row', marginHorizontal: spacing.xxl, marginBottom: spacing.md, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.xxs+1, gap: spacing.xxs },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md+1, borderRadius: radius.lg, gap: spacing.sm },
  tabBtnOn:   { backgroundColor: colors.navy, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  tabTxt:     { color: colors.textDim, fontSize: typography.size.body, fontWeight: typography.weight.regular },
  tabTxtOn:   { color: colors.text, fontWeight: typography.weight.semibold },
  tabBadge:   { width: 16, height: 16, borderRadius: 0, backgroundColor: '#C87860', alignItems: 'center', justifyContent: 'center' },
  tabBadgeTxt:{ color: '#FFFFFF', fontSize: typography.size.xs, fontWeight: typography.weight.bold },

  sectionLbl: { color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 3, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.lg },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.xxl },
  chip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipOn:    { backgroundColor: 'rgba(200,151,90,0.14)', borderColor: '#c8975a', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  chipTxt:   { color: colors.textMuted, fontSize: typography.size.body, fontWeight: typography.weight.regular },
  chipTxtOn: { color: '#c8975a', fontWeight: typography.weight.semibold },

  proCard:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.xxl, padding: spacing.xl, borderRadius: radius.xxl, backgroundColor: '#0D1628', borderWidth: 1, borderColor: 'rgba(200,151,90,0.5)' },
  proCardIcon:  { width: 46, height: 46, borderRadius: radius.lg, backgroundColor: 'rgba(200,151,90,0.25)', alignItems: 'center', justifyContent: 'center' },
  proCardTitle: { color: '#FFD580', fontSize: typography.size.subheading, fontWeight: typography.weight.semibold, marginBottom: 2 },
  proCardSub:   { color: 'rgba(255,255,255,0.75)', fontSize: typography.size.caption },
  proCardArrow: { color: '#FFD580', fontSize: 22 },

  settingsCard:    { marginHorizontal: spacing.xxl, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  settingRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  settingBorder:   { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  settingIconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' },
  settingIcon:     { fontSize: 16 },
  settingLabel:    { flex: 1, color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular },
  settingArrow:    { color: colors.textDim, fontSize: 20 },

  signOutBtn: { marginHorizontal: spacing.xxl, marginTop: spacing.lg, paddingVertical: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(224,90,90,0.2)', alignItems: 'center' },
  signOutTxt: { color: colors.red, fontSize: typography.size.bodyLg },
  deleteAccountBtn: { marginHorizontal: spacing.xxl, marginTop: spacing.sm, paddingVertical: spacing.md, alignItems: 'center' },
  deleteAccountTxt: { color: colors.textDim, fontSize: typography.size.caption, textDecorationLine: 'underline' },

  center:     { alignItems: 'center', paddingVertical: 52, gap: spacing.lg },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: typography.size.heading1, fontWeight: typography.weight.regular },
  emptySub:   { color: colors.textMuted, fontSize: typography.size.bodyLg, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderWidth: 1, borderColor: 'rgba(200,151,90,0.35)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  emptyBtnTxt:{ color: colors.text, fontSize: typography.size.bodyLg },

  favCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg, overflow: 'hidden' },
  favThumb:     { width: 70, height: 90, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  favEmoji:     { fontSize: 28 },
  favBody:      { flex: 1, gap: spacing.xxs+1 },
  favCuisine:   { color: '#C87860', fontSize: typography.size.xs, letterSpacing: 2, marginBottom: 1 },
  favName:      { color: colors.text, fontSize: typography.size.subheading, fontWeight: typography.weight.regular, marginBottom: 2 },
  favMeta:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  favRating:    { color: '#C87860', fontSize: typography.size.caption, fontWeight: typography.weight.medium },
  favSep:       { color: colors.textDim },
  favPrice:     { color: colors.textMuted, fontSize: typography.size.caption },
  favResaBtn:   { alignSelf: 'flex-start', backgroundColor: '#006233', borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  favResaBtnTxt:{ color: '#FFFFFF', fontSize: typography.size.caption, fontWeight: typography.weight.semibold },
  favHeart:     { width: 32, height: 32, borderRadius: 0, backgroundColor: 'rgba(200,151,90,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(200,151,90,0.35)', flexShrink: 0, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  favHeartTxt:  { fontSize: 14 },
});
