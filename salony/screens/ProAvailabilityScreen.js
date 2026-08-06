import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Switch, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

const JOURS = [
  { value: 1, cle: 'lun' },
  { value: 2, cle: 'mar' },
  { value: 3, cle: 'mer' },
  { value: 4, cle: 'jeu' },
  { value: 5, cle: 'ven' },
  { value: 6, cle: 'sam' },
  { value: 0, cle: 'dim' },
];

const HORAIRE_PAR_DEFAUT = { ouvert: false, heure_debut: '09:00', heure_fin: '18:00' };

function isHeureValide(heure) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(heure);
}

export default function ProAvailabilityScreen({ route }) {
  const t = useT();
  const { staffId, staffNom } = route.params;
  const [horaires, setHoraires] = useState(
    Object.fromEntries(JOURS.map((j) => [j.value, { ...HORAIRE_PAR_DEFAUT }]))
  );
  const [exceptions, setExceptions] = useState([]);
  const [nouvelleException, setNouvelleException] = useState({ date: '', motif: '' });
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = useCallback(async () => {
    const [{ data: dispo }, { data: exc }] = await Promise.all([
      supabase.from('availabilities').select('*').eq('staff_id', staffId),
      supabase.from('availability_exceptions').select('*').eq('staff_id', staffId).order('date'),
    ]);

    setHoraires((prev) => {
      const next = { ...prev };
      JOURS.forEach((j) => { next[j.value] = { ...HORAIRE_PAR_DEFAUT }; });
      (dispo ?? []).forEach((d) => {
        next[d.jour_semaine] = {
          ouvert: true,
          heure_debut: d.heure_debut.slice(0, 5),
          heure_fin: d.heure_fin.slice(0, 5),
        };
      });
      return next;
    });
    setExceptions(exc ?? []);
  }, [staffId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const majJour = (jour, champ, valeur) => {
    setHoraires((prev) => ({ ...prev, [jour]: { ...prev[jour], [champ]: valeur } }));
  };

  const enregistrerHoraires = async () => {
    for (const j of JOURS) {
      const h = horaires[j.value];
      if (h.ouvert && (!isHeureValide(h.heure_debut) || !isHeureValide(h.heure_fin) || h.heure_fin <= h.heure_debut)) {
        Alert.alert(
          t('disponibilites.horaireInvalide'),
          t('disponibilites.horaireInvalideMessage', { jour: t(`jours.${j.cle}`) })
        );
        return;
      }
    }

    setEnregistrement(true);
    await supabase.from('availabilities').delete().eq('staff_id', staffId);

    const lignes = JOURS
      .filter((j) => horaires[j.value].ouvert)
      .map((j) => ({
        staff_id: staffId,
        jour_semaine: j.value,
        heure_debut: horaires[j.value].heure_debut,
        heure_fin: horaires[j.value].heure_fin,
      }));

    if (lignes.length > 0) {
      await supabase.from('availabilities').insert(lignes);
    }
    setEnregistrement(false);
    Alert.alert(t('disponibilites.enregistre'), t('disponibilites.horairesMisAJour'));
  };

  const ajouterException = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nouvelleException.date)) {
      Alert.alert(t('disponibilites.dateInvalide'), t('disponibilites.dateInvalideMessage'));
      return;
    }
    const { error } = await supabase.from('availability_exceptions').insert({
      staff_id: staffId,
      date: nouvelleException.date,
      disponible: false,
      motif: nouvelleException.motif || null,
    });
    if (error) {
      Alert.alert(t('commun.erreur'), error.message);
      return;
    }
    setNouvelleException({ date: '', motif: '' });
    charger();
  };

  const supprimerException = async (id) => {
    await supabase.from('availability_exceptions').delete().eq('id', id);
    charger();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Text style={styles.titre}>{t('disponibilites.titre', { nom: staffNom })}</Text>

      <Text style={styles.sectionTitre}>{t('disponibilites.horairesHabituels')}</Text>
      {JOURS.map((j) => {
        const h = horaires[j.value];
        return (
          <Card key={j.value} style={styles.jourCard}>
            <View style={styles.jourHeader}>
              <Text style={styles.jourLabel}>{t(`jours.${j.cle}`)}</Text>
              <Switch
                value={h.ouvert}
                onValueChange={(v) => majJour(j.value, 'ouvert', v)}
                trackColor={{ true: colors.primary }}
              />
            </View>
            {h.ouvert && (
              <View style={styles.heuresRow}>
                <TextInput
                  style={styles.heureInput}
                  value={h.heure_debut}
                  onChangeText={(v) => majJour(j.value, 'heure_debut', v)}
                  placeholder="09:00"
                  maxLength={5}
                />
                <Text style={styles.heureSeparateur}>—</Text>
                <TextInput
                  style={styles.heureInput}
                  value={h.heure_fin}
                  onChangeText={(v) => majJour(j.value, 'heure_fin', v)}
                  placeholder="18:00"
                  maxLength={5}
                />
              </View>
            )}
          </Card>
        );
      })}
      <Button title={t('disponibilites.enregistrerHoraires')} onPress={enregistrerHoraires} loading={enregistrement} />

      <Text style={styles.sectionTitre}>{t('disponibilites.conges')}</Text>
      {exceptions.map((e) => (
        <Card key={e.id} style={styles.exceptionCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.exceptionDate}>{e.date}</Text>
            {e.motif ? <Text style={styles.exceptionMotif}>{e.motif}</Text> : null}
          </View>
          <Pressable onPress={() => supprimerException(e.id)}>
            <Text style={styles.supprimer}>{t('commun.supprimer')}</Text>
          </Pressable>
        </Card>
      ))}

      <Card style={{ gap: spacing.sm }}>
        <TextInput
          style={styles.input}
          placeholder={t('disponibilites.datePlaceholder')}
          value={nouvelleException.date}
          onChangeText={(v) => setNouvelleException((prev) => ({ ...prev, date: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder={t('disponibilites.motifPlaceholder')}
          value={nouvelleException.motif}
          onChangeText={(v) => setNouvelleException((prev) => ({ ...prev, motif: v }))}
        />
        <Button title={t('disponibilites.ajouterJourFerme')} variant="outline" onPress={ajouterException} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titre: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  sectionTitre: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary, marginTop: spacing.sm },
  jourCard: { gap: spacing.sm },
  jourHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jourLabel: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.textPrimary },
  heuresRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heureInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  heureSeparateur: { color: colors.textSecondary },
  exceptionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exceptionDate: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: colors.textPrimary },
  exceptionMotif: { fontSize: typography.size.sm, color: colors.textSecondary },
  supprimer: { color: colors.error, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
});
