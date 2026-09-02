import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, Alert, Linking, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useProfil from '../src/hooks/useProfil';
import usePoints from '../src/hooks/usePoints';
import GuestWall from '../src/components/GuestWall';
import Button from '../src/components/Button';
import PointsHistoryModal from '../src/components/PointsHistoryModal';
import PrivacyPolicyModal from '../src/components/PrivacyPolicyModal';
import { useGuestContext } from '../src/context/GuestContext';

export default function ProfilScreen({ navigation }) {
  const { isGuest } = useGuestContext();
  const {
    userEmail, firstName, setFirstName, lastName, setLastName,
    city, phone, setPhone, memberSince, avatarUri, uploading,
    editingName, savingName,
    reservationsCount, favoritesCount, reviewsCount,
    activeSits, setActiveSits, activeCuisines, setActiveCuisines,
    isManager, isAdmin,
    displayName, initial,
    pickAvatar, saveName, signOut, deleteAccount, toggleEditing,
  } = useProfil();
  const { balance: pointsBalance, history: pointsHistory, loading: pointsLoading, erreur: pointsErreur, refresh: refreshPoints } = usePoints();
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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

  const goProInscription = useCallback(() => navigation.navigate('ProInscription'), [navigation]);
  const goPrivacy        = useCallback(() => setShowPrivacy(true), []);
  const goReview         = useCallback(() => Linking.openURL('https://apps.apple.com/app/id6776171199?action=write-review'), []);

  if (isGuest) {
    return <GuestWall title="Mon profil" message="Connectez-vous pour gérer votre profil, vos réservations et vos favoris." />;
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={true} keyboardDismissMode="interactive">

        <View style={s.topRow}>
          <TouchableOpacity style={s.editBtn} onPress={toggleEditing}>
            <Text style={s.editBtnTxt}>{editingName ? 'Fermer' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.heroBlock}>
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
              <Button
                variant="secondary"
                containerStyle={s.simpleBtn}
                textStyle={s.simpleBtnTxt}
                onPress={saveName}
                loading={savingName}
              >
                Enregistrer
              </Button>
            </View>
          ) : (
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{displayName}</Text>
              {!!phone       && <Text style={s.heroMeta}>{phone}</Text>}
              {!phone        && <Text style={s.heroMeta}>{userEmail}</Text>}
              {!!city        && <Text style={s.heroMeta}>📍 {city}</Text>}
              {!!memberSince && <Text style={s.heroMember}>Membre depuis {memberSince}</Text>}
            </View>
          )}
        </View>

        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{reservationsCount}</Text>
            <Text style={s.statLbl}>Réservations</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statVal}>{favoritesCount}</Text>
            <Text style={s.statLbl}>Favoris</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statVal}>{reviewsCount}</Text>
            <Text style={s.statLbl}>Avis laissés</Text>
          </View>
        </View>

        <View style={s.pointsCard}>
          <View>
            <Text style={s.pointsLbl}>Points fidélité</Text>
            <Text style={s.pointsVal}>{pointsBalance.toLocaleString('fr-FR')}</Text>
          </View>
          <TouchableOpacity style={s.pointsCta} onPress={() => setShowPointsHistory(true)}>
            <Text style={s.pointsCtaTxt}>Historique</Text>
          </TouchableOpacity>
        </View>

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

        {!isManager && (
          <View style={s.proCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.proCardTitle}>Vous êtes restaurateur ?</Text>
              <Text style={s.proCardSub}>Passez à l'espace pro MIDA.</Text>
            </View>
            <Button
              variant="secondary"
              small
              fullWidth={false}
              containerStyle={[s.simpleBtn, s.proCardBtn]}
              textStyle={s.proCardBtnTxt}
              onPress={goProInscription}
            >
              Basculer
            </Button>
          </View>
        )}

        <View style={s.divider} />
        {[
          { label:'Informations personnelles',  screen:'Settings'  },
          { label:'Mes commandes',               screen:'MyOrders'  },
          { label:'Notifications',               screen:'Notifications' },
          { label:'Confidentialité',             action: goPrivacy  },
          { label:'Aide & Support',              screen:'Aide'      },
          { label:'Donner un avis sur MIDA',     action: goReview  },
          ...(isAdmin ? [{ label:'Validation restaurants', screen:'AdminValidation' }] : []),
        ].map((item, i) => (
          <TouchableOpacity key={i} style={s.settingRow} onPress={() => item.action ? item.action() : item.screen && navigation.navigate(item.screen)}>
            <Text style={s.settingLabel}>{item.label}</Text>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.signOutWrap} onPress={signOut}>
          <Text style={s.signOutTxt}>Se déconnecter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteAccountBtn} onPress={confirmDeleteAccount}>
          <Text style={s.deleteAccountTxt}>Supprimer mon compte</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      <PointsHistoryModal
        visible={showPointsHistory}
        onClose={() => setShowPointsHistory(false)}
        balance={pointsBalance}
        history={pointsHistory}
        loading={pointsLoading}
        erreur={pointsErreur}
        onRetry={refreshPoints}
      />
      <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </SafeAreaView>
  );
}

const SITUATIONS = ['🌙 Dîner calme', '👪 En famille', '💼 Affaires'];
const CUISINES   = ['🥘 Algérien', '🐟 Méditerranéen', '🍷 Français', '🍕 Italien'];

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  topRow:      { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  editBtn:     { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.noir },
  editBtnTxt:  { fontFamily: typography.bodyMedium, color: colors.text, fontSize: typography.size.caption },

  // Boutons "simples" : cadre noir rectangulaire, fond transparent, texte foncé, pas d'icône
  simpleBtn:      { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.noir, borderRadius: radius.sm },
  simpleBtnTxt:   { color: colors.noir },
  // Variante sur fond noir (proCard) : cadre/texte blancs pour rester visibles
  proCardBtn:     { borderColor: '#FFFFFF' },
  proCardBtnTxt:  { color: '#FFFFFF' },

  heroBlock:     { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.xxl, paddingHorizontal: spacing.xxl },
  avatarWrap:    { position: 'relative', marginBottom: spacing.lg },
  avatarRing:    { width: 104, height: 104, borderRadius: 52, borderWidth: 2.5, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  avatarClip:    { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  avatarImg:     { width: 96, height: 96 },
  // Doc : cercle bg vert(→cyan) + initiales crème Space Grotesk 700 (pas gris)
  avatarFallback:{ width: 96, height: 96, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: typography.display, color: colors.cream, fontSize: 36 },
  avatarBadge:   { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  heroInfo:      { alignItems: 'center', gap: spacing.sm },
  // Doc : "font:700 18px Space Grotesk"
  heroName:      { color: colors.text, fontFamily: typography.display, fontSize: 18, letterSpacing: -0.3 },
  // Doc : "font:400 12.5px DM Sans" color rgba(.5)
  heroMeta:      { fontFamily: typography.body, color: 'rgba(10,10,10,0.5)', fontSize: 12.5, marginTop: 1 },
  heroMember:    { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.sm, letterSpacing: 1, marginTop: 2 },
  editBlock:     { width: '100%', gap: spacing.lg },
  editRow:       { flexDirection: 'row', gap: spacing.lg },
  editInput:     { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, color: colors.text, fontFamily: typography.body, fontSize: typography.size.subheading, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },

  // Doc : "font:700 20px Space Grotesk" (valeur) + "font:500 10.5px DM Sans" rgba(.55) (label), fond crème, radius13, padding14
  statsRow: { flexDirection: 'row', marginHorizontal: spacing.xxl, gap: spacing.md },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: colors.glassBg, borderRadius: 13, paddingVertical: 14 },
  statVal:  { color: colors.text, fontFamily: typography.display, fontSize: 20 },
  statLbl:  { fontFamily: typography.bodyMedium, color: 'rgba(10,10,10,0.55)', fontSize: 10.5, marginTop: 5 },

  pointsCard:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.xxl, marginTop: spacing.xl - 4, backgroundColor: colors.noir, borderRadius: 14, padding: spacing.xl + 2 },
  pointsLbl:     { fontFamily: typography.bodyBold, color: 'rgba(255,255,255,0.6)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.4 },
  pointsVal:     { fontFamily: typography.display, color: '#FFFFFF', fontSize: 26, marginTop: 4 },
  pointsCta:     { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg + 2, paddingVertical: spacing.md + 1 },
  pointsCtaTxt:  { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.caption },

  sectionLbl: { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.xs, letterSpacing: 3, paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.lg },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.xxl },
  chip:      { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.full, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.cardBorder },
  chipOn:    { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  chipTxt:   { fontFamily: typography.body, color: colors.textMuted, fontSize: typography.size.body },
  chipTxtOn: { fontFamily: typography.bodySemibold, color: colors.primary },

  // Doc : radius14 (pas 22), bouton "Basculer" migré vers <Button variant="pro" small>
  proCard:      { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginHorizontal: spacing.xxl, marginTop: spacing.xxl, padding: spacing.xl, borderRadius: 14, backgroundColor: colors.noir },
  proCardTitle: { color: colors.gold, fontFamily: typography.display, fontSize: 13.5, marginBottom: 2 },
  proCardSub:   { fontFamily: typography.body, color: 'rgba(255,255,255,0.6)', fontSize: 11.5 },

  // Doc : liste plate avec séparateurs fins, pas de carte encartée — padding "15px 2px"
  divider:       { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.xs },
  settingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  settingLabel:  { fontFamily: typography.bodyMedium, color: colors.text, fontSize: typography.size.subheading },
  settingArrow:  { color: colors.textDim, fontSize: 20 },

  signOutWrap: { alignItems: 'center', paddingVertical: spacing.xxl },
  signOutTxt:  { fontFamily: typography.bodySemibold, color: colors.resa, fontSize: typography.size.bodyLg },
  deleteAccountBtn: { alignItems: 'center', paddingBottom: spacing.md },
  deleteAccountTxt: { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption, textDecorationLine: 'underline' },
});
