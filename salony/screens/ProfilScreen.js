import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Avatar from '../src/components/Avatar';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import { useSalon } from '../src/SalonContext';
import { useI18n, LANGUES } from '../src/i18n';

export default function ProfilScreen({ navigation }) {
  const { t, langue, changerLangue } = useI18n();
  const [profil, setProfil] = useState(null);
  const { salons } = useSalon();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfil(data);
    })();
  }, []);

  const selectionnerLangue = async (code) => {
    if (code === langue) return;

    const redemarrageRequis = await changerLangue(code);
    // la préférence est aussi stockée côté serveur : les rappels WhatsApp
    // doivent partir dans la langue du client
    await supabase.from('profiles').update({ langue: code }).eq('id', profil.id);
    setProfil((prev) => ({ ...prev, langue: code }));

    if (redemarrageRequis) {
      Alert.alert(t('profil.langueChangee'), t('profil.redemarrageRequis'));
    }
  };

  if (!profil) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar uri={profil.avatar_url} nom={`${profil.prenom ?? ''} ${profil.nom ?? ''}`} size={72} />
        <Text style={styles.nom}>{profil.prenom} {profil.nom}</Text>
        <Text style={styles.telephone}>{profil.telephone}</Text>
      </View>

      <Card style={styles.fiabiliteCard}>
        <Text style={styles.fiabiliteLabel}>{t('profil.scoreFiabilite')}</Text>
        <Text style={styles.fiabiliteValeur}>{profil.score_fiabilite} / 5</Text>
      </Card>

      <Card style={styles.langueCard}>
        <Text style={styles.fiabiliteLabel}>{t('profil.langue')}</Text>
        <View style={styles.langues}>
          {LANGUES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => selectionnerLangue(l.code)}
              style={[styles.langueChip, langue === l.code && styles.langueChipActif]}
            >
              <Text style={[styles.langueTexte, langue === l.code && styles.langueTexteActif]}>
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {salons.length > 1 && (
        <Button
          title={t('profil.changerSalon')}
          variant="outline"
          onPress={() => navigation.navigate('ProSalonSelect')}
          style={{ marginTop: spacing.lg }}
        />
      )}

      <Button
        title={t('profil.seDeconnecter')}
        variant="outline"
        onPress={() => supabase.auth.signOut()}
        style={{ marginTop: spacing.md }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { alignItems: 'center', gap: spacing.xs, marginVertical: spacing.lg },
  nom: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary },
  telephone: { fontSize: typography.size.sm, color: colors.textSecondary },
  fiabiliteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fiabiliteLabel: { fontSize: typography.size.md, color: colors.textPrimary },
  fiabiliteValeur: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.primary },
  langueCard: { marginTop: spacing.md, gap: spacing.sm },
  langues: { flexDirection: 'row', gap: spacing.sm },
  langueChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langueChipActif: { backgroundColor: colors.primary, borderColor: colors.primary },
  langueTexte: { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.textPrimary },
  langueTexteActif: { color: colors.textInverse },
});
