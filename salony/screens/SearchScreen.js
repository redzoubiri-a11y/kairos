import React, { useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, ScrollView, Pressable, Text, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import SalonCard from '../src/components/SalonCard';
import EmptyState from '../src/components/EmptyState';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

const TYPES = [
  { value: null, cle: 'tous' },
  { value: 'coiffure', cle: 'coiffure' },
  { value: 'esthetique', cle: 'esthetique' },
  { value: 'spa', cle: 'spa' },
  { value: 'barbier', cle: 'barbier' },
  { value: 'ongles', cle: 'ongles' },
];

export default function SearchScreen({ navigation }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [typeFiltre, setTypeFiltre] = useState(null);
  const [resultats, setResultats] = useState([]);
  const [modeProximite, setModeProximite] = useState(false);
  const [chargementPosition, setChargementPosition] = useState(false);

  const rechercher = async (texte, type) => {
    setModeProximite(false);
    let req = supabase.from('salons').select('*').eq('statut', 'valide');
    if (texte) req = req.or(`nom.ilike.%${texte}%,quartier.ilike.%${texte}%,ville.ilike.%${texte}%`);
    if (type) req = req.eq('type', type);
    const { data } = await req.limit(30);
    setResultats(data ?? []);
  };

  const rechercherAutourDeMoi = async () => {
    setChargementPosition(true);
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setChargementPosition(false);
      Alert.alert(t('recherche.localisationRefusee'), t('recherche.localisationRefuseeMessage'));
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    const { data } = await supabase.rpc('salons_a_proximite', {
      p_latitude: position.coords.latitude,
      p_longitude: position.coords.longitude,
      p_rayon_km: 15,
      p_type: typeFiltre,
    });

    setChargementPosition(false);
    setModeProximite(true);
    setQuery('');
    setResultats(data ?? []);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={t('recherche.placeholder')}
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={(texte) => { setQuery(texte); rechercher(texte, typeFiltre); }}
      />

      <View style={styles.boutonsRow}>
        <Button
          title={t('recherche.autourDeMoi')}
          variant="outline"
          onPress={rechercherAutourDeMoi}
          loading={chargementPosition}
          style={styles.boutonAction}
        />
        <Button
          title={t('recherche.carte')}
          variant="outline"
          onPress={() => navigation.navigate('Map')}
          style={styles.boutonAction}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtres} contentContainerStyle={{ gap: spacing.sm }}>
        {TYPES.map((type) => (
          <Pressable
            key={type.cle}
            onPress={() => { setTypeFiltre(type.value); rechercher(query, type.value); }}
            style={[styles.chip, typeFiltre === type.value && styles.chipActif]}
          >
            <Text style={[styles.chipTexte, typeFiltre === type.value && styles.chipTexteActif]}>
              {t(`types.${type.cle}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={resultats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={
          modeProximite && resultats.length > 0 ? (
            <Text style={styles.enTete}>{t('recherche.resultatsProximite', { n: resultats.length })}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View>
            <SalonCard salon={item} onPress={() => navigation.navigate('Salon', { salonId: item.id })} />
            {item.distance_km != null && (
              <Text style={styles.distance}>{t('recherche.distance', { n: item.distance_km })}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            titre={t('recherche.aucunResultat')}
            message={t(
              modeProximite ? 'recherche.aucunResultatProximite' : 'recherche.aucunResultatMessage'
            )}
            icone="🔍"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
  boutonsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  boutonAction: { flex: 1 },
  enTete: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  distance: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    marginStart: spacing.sm,
  },
  filtres: { marginVertical: spacing.md, flexGrow: 0 },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActif: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexte: { color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  chipTexteActif: { color: colors.textInverse },
  liste: { paddingBottom: spacing.xl },
});
