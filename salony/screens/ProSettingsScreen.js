import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView, Switch, StyleSheet, Alert, Image, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { uploadPhoto } from '../src/photos';
import { useT } from '../src/i18n';

const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

const HORAIRE_DEFAUT = { ouvert: false, debut: '09:00', fin: '19:00' };

function isHeureValide(h) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(h);
}

export default function ProSettingsScreen({ route, navigation }) {
  const t = useT();
  const { salonId } = route.params;
  const [salon, setSalon] = useState(null);
  const [horaires, setHoraires] = useState({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [uploadEnCours, setUploadEnCours] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data } = await supabase.from('salons').select('*').eq('id', salonId).single();
        setSalon(data);
        const base = Object.fromEntries(JOURS.map((j) => [j, { ...HORAIRE_DEFAUT }]));
        setHoraires({ ...base, ...(data?.horaires ?? {}) });
      })();
    }, [salonId])
  );

  const majChamp = (champ, valeur) => setSalon((prev) => ({ ...prev, [champ]: valeur }));
  const majHoraire = (jour, champ, valeur) =>
    setHoraires((prev) => ({ ...prev, [jour]: { ...prev[jour], [champ]: valeur } }));

  const enregistrer = async () => {
    for (const j of JOURS) {
      const h = horaires[j];
      if (h.ouvert && (!isHeureValide(h.debut) || !isHeureValide(h.fin) || h.fin <= h.debut)) {
        Alert.alert(
          t('disponibilites.horaireInvalide'),
          t('disponibilites.horaireInvalideMessage', { jour: t(`jours.${j}`) })
        );
        return;
      }
    }

    const delai = Number(salon.delai_annulation_h);
    if (!Number.isInteger(delai) || delai < 0) {
      Alert.alert(t('reglages.delaiInvalide'), t('reglages.delaiInvalideMessage'));
      return;
    }

    setEnregistrement(true);
    const { error } = await supabase
      .from('salons')
      .update({
        nom: salon.nom,
        description: salon.description,
        telephone: salon.telephone,
        whatsapp: salon.whatsapp,
        adresse: salon.adresse,
        quartier: salon.quartier,
        ville: salon.ville,
        delai_annulation_h: delai,
        horaires,
      })
      .eq('id', salonId);
    setEnregistrement(false);

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    Alert.alert(t('reglages.enregistre'), t('reglages.enregistreMessage'));
  };

  const ajouterPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('reglages.permissionRefusee'), t('reglages.permissionPhotos'));
      return;
    }

    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (resultat.canceled) return;

    setUploadEnCours(true);
    const url = await uploadPhoto(resultat.assets[0].uri, 'salons');
    setUploadEnCours(false);

    if (!url) {
      Alert.alert(t('reglages.echecUpload'), t('reglages.echecUploadMessage'));
      return;
    }

    const nouvelles = [...(salon.photos ?? []), url];
    await supabase.from('salons').update({ photos: nouvelles }).eq('id', salonId);
    majChamp('photos', nouvelles);
  };

  const retirerPhoto = async (url) => {
    const nouvelles = (salon.photos ?? []).filter((p) => p !== url);
    await supabase.from('salons').update({ photos: nouvelles }).eq('id', salonId);
    majChamp('photos', nouvelles);
  };

  if (!salon) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Text style={styles.titre}>{t('reglages.titre')}</Text>

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.sectionTitre}>{t('reglages.informations')}</Text>
        {[
          { champ: 'nom', cle: 'nomSalon' },
          { champ: 'description', cle: 'description' },
          { champ: 'telephone', cle: 'telephone' },
          { champ: 'whatsapp', cle: 'whatsapp' },
          { champ: 'adresse', cle: 'adresse' },
          { champ: 'quartier', cle: 'quartier' },
          { champ: 'ville', cle: 'ville' },
        ].map(({ champ, cle }) => (
          <View key={champ}>
            <Text style={styles.label}>{t(`reglages.${cle}`)}</Text>
            <TextInput
              style={styles.input}
              value={salon[champ] ?? ''}
              onChangeText={(v) => majChamp(champ, v)}
            />
          </View>
        ))}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.sectionTitre}>{t('reglages.position')}</Text>
        <Text style={styles.aide}>
          {t(salon.latitude != null ? 'reglages.positionOk' : 'reglages.positionAbsente')}
        </Text>
        <Button
          title={t(salon.latitude != null ? 'reglages.modifierPosition' : 'reglages.placerCarte')}
          variant="outline"
          onPress={() => navigation.navigate('ProLocation', { salonId })}
        />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.sectionTitre}>{t('reglages.politiqueAnnulation')}</Text>
        <Text style={styles.aide}>{t('reglages.delaiAide')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(salon.delai_annulation_h ?? 24)}
          onChangeText={(v) => majChamp('delai_annulation_h', v.replace(/[^0-9]/g, ''))}
        />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.sectionTitre}>{t('reglages.horairesOuverture')}</Text>
        {JOURS.map((j) => {
          const h = horaires[j] ?? HORAIRE_DEFAUT;
          return (
            <View key={j} style={styles.jourBloc}>
              <View style={styles.jourHeader}>
                <Text style={styles.jourLabel}>{t(`jours.${j}`)}</Text>
                <Switch
                  value={h.ouvert}
                  onValueChange={(v) => majHoraire(j, 'ouvert', v)}
                  trackColor={{ true: colors.primary }}
                />
              </View>
              {h.ouvert && (
                <View style={styles.heuresRow}>
                  <TextInput
                    style={styles.heureInput}
                    value={h.debut}
                    onChangeText={(v) => majHoraire(j, 'debut', v)}
                    maxLength={5}
                  />
                  <Text style={styles.separateur}>—</Text>
                  <TextInput
                    style={styles.heureInput}
                    value={h.fin}
                    onChangeText={(v) => majHoraire(j, 'fin', v)}
                    maxLength={5}
                  />
                </View>
              )}
            </View>
          );
        })}
        <Text style={styles.aide}>{t('reglages.horairesAide')}</Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text style={styles.sectionTitre}>{t('reglages.photos')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {(salon.photos ?? []).map((url) => (
            <Pressable key={url} onLongPress={() => retirerPhoto(url)}>
              <Image source={{ uri: url }} style={styles.photo} />
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.aide}>{t('reglages.photosAide')}</Text>
        <Button title={t('reglages.ajouterPhoto')} variant="outline" onPress={ajouterPhoto} loading={uploadEnCours} />
      </Card>

      <Button title={t('commun.enregistrer')} onPress={enregistrer} loading={enregistrement} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary },
  sectionTitre: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  aide: { fontSize: typography.size.xs, color: colors.textSecondary },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  jourBloc: { gap: spacing.xs },
  jourHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jourLabel: { fontSize: typography.size.md, color: colors.textPrimary },
  heuresRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heureInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  separateur: { color: colors.textSecondary },
  photo: { width: 90, height: 90, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
});
