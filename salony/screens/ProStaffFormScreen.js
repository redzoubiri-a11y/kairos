import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import Avatar from '../src/components/Avatar';
import { uploadPhoto } from '../src/photos';
import { useT } from '../src/i18n';

export default function ProStaffFormScreen({ route, navigation }) {
  const t = useT();
  const { salonId, staff } = route.params ?? {};
  const edition = !!staff;

  const [nom, setNom] = useState(staff?.nom ?? '');
  const [specialites, setSpecialites] = useState((staff?.specialites ?? []).join(', '));
  const [photoUrl, setPhotoUrl] = useState(staff?.photo_url ?? null);
  const [telephoneLien, setTelephoneLien] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [upload, setUpload] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesAssures, setServicesAssures] = useState([]);

  // catalogue du salon + prestations déjà assurées par ce praticien
  useEffect(() => {
    if (!edition) return;
    (async () => {
      const [{ data: catalogue }, { data: liens }] = await Promise.all([
        supabase.from('services').select('id, nom, duree_min').eq('salon_id', salonId).eq('actif', true),
        supabase.from('staff_services').select('service_id').eq('staff_id', staff.id),
      ]);
      setServices(catalogue ?? []);
      setServicesAssures((liens ?? []).map((l) => l.service_id));
    })();
  }, [edition, salonId, staff?.id]);

  const basculerService = async (serviceId, estCoche) => {
    // mise à jour optimiste : la matrice est un simple jeu de liaisons
    setServicesAssures((prev) =>
      estCoche ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );

    if (estCoche) {
      await supabase
        .from('staff_services')
        .delete()
        .eq('staff_id', staff.id)
        .eq('service_id', serviceId);
    } else {
      await supabase.from('staff_services').insert({ staff_id: staff.id, service_id: serviceId });
    }
  };

  const choisirPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('reglages.permissionRefusee'), t('reglages.permissionPhotos'));
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (resultat.canceled) return;

    setUpload(true);
    const url = await uploadPhoto(resultat.assets[0].uri, 'staff');
    setUpload(false);
    if (!url) {
      Alert.alert(t('reglages.echecUpload'), t('reglages.echecUploadMessage'));
      return;
    }
    setPhotoUrl(url);
  };

  const enregistrer = async () => {
    if (!nom.trim()) {
      Alert.alert(t('equipe.nomRequis'), t('equipe.nomRequisMessage'));
      return;
    }

    setEnvoi(true);
    const valeurs = {
      nom: nom.trim(),
      photo_url: photoUrl,
      specialites: specialites
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const { error } = edition
      ? await supabase.from('staff').update(valeurs).eq('id', staff.id)
      : await supabase.from('staff').insert({ ...valeurs, salon_id: salonId });

    setEnvoi(false);
    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    navigation.goBack();
  };

  const lierCompte = async () => {
    if (!telephoneLien.trim()) return;

    const { data, error } = await supabase.rpc('lier_staff_a_profil', {
      p_staff_id: staff.id,
      p_telephone: telephoneLien.trim(),
    });

    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    const resultat = Array.isArray(data) ? data[0] : data;
    Alert.alert(
      t(resultat?.lie ? 'equipe.compteRattacheOk' : 'equipe.rattachementImpossible'),
      resultat?.message ?? ''
    );
    if (resultat?.lie) setTelephoneLien('');
  };

  const retirerPraticien = () => {
    Alert.alert(
      t('equipe.retirerTitre'),
      t('equipe.retirerMessage'),
      [
        { text: t('commun.retour'), style: 'cancel' },
        {
          text: t('commun.supprimer'),
          style: 'destructive',
          onPress: async () => {
            // désactivation plutôt que suppression : les bookings référencent
            // le praticien avec on delete restrict
            await supabase.from('staff').update({ actif: false }).eq('id', staff.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <View style={styles.photoBloc}>
        <Pressable onPress={choisirPhoto}>
          <Avatar uri={photoUrl} nom={nom} size={88} />
        </Pressable>
        <Button
          title={t(photoUrl ? 'equipe.changerPhoto' : 'equipe.ajouterPhoto')}
          variant="ghost"
          onPress={choisirPhoto}
          loading={upload}
        />
      </View>

      <View>
        <Text style={styles.label}>{t('equipe.nomPraticien')}</Text>
        <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder={t('equipe.nomPlaceholder')} />
      </View>

      <View>
        <Text style={styles.label}>{t('equipe.specialites')}</Text>
        <TextInput
          style={styles.input}
          value={specialites}
          onChangeText={setSpecialites}
          placeholder={t('equipe.specialitesPlaceholder')}
        />
        <Text style={styles.aide}>{t('equipe.specialitesAide')}</Text>
      </View>

      <Button
        title={t(edition ? 'commun.enregistrer' : 'equipe.ajouterPraticien')}
        onPress={enregistrer}
        loading={envoi}
      />

      {edition && (
        <>
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.sectionTitre}>{t('equipe.prestationsAssurees')}</Text>
            <Text style={styles.aide}>{t('equipe.prestationsAide')}</Text>
            {services.map((service) => {
              const coche = servicesAssures.includes(service.id);
              return (
                <Pressable
                  key={service.id}
                  style={styles.serviceRow}
                  onPress={() => basculerService(service.id, coche)}
                >
                  <View style={[styles.checkbox, coche && styles.checkboxCoche]} />
                  <Text style={styles.serviceNom}>{service.nom}</Text>
                  <Text style={styles.serviceDuree}>{t('commun.minutes', { n: service.duree_min })}</Text>
                </Pressable>
              );
            })}
            {services.length === 0 && (
              <Text style={styles.aide}>{t('equipe.aucuneAuCatalogue')}</Text>
            )}
          </Card>

          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.sectionTitre}>{t('equipe.compteEmploye')}</Text>
            <Text style={styles.aide}>
              {t(staff.profile_id ? 'equipe.compteDejaLie' : 'equipe.compteALier')}
            </Text>
            <TextInput
              style={styles.input}
              value={telephoneLien}
              onChangeText={setTelephoneLien}
              placeholder={t('equipe.telephoneEmploye')}
              keyboardType="phone-pad"
            />
            <Button title={t('equipe.rattacherCompte')} variant="outline" onPress={lierCompte} />
          </Card>

          <Button title={t('equipe.retirer')} variant="ghost" onPress={retirerPraticien} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  photoBloc: { alignItems: 'center', gap: spacing.xs },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  aide: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitre: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  serviceNom: { flex: 1, fontSize: typography.size.md, color: colors.textPrimary },
  serviceDuree: { fontSize: typography.size.sm, color: colors.textSecondary },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkboxCoche: { backgroundColor: colors.primary, borderColor: colors.primary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
});
