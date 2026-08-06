import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, typography } from '../src/theme';
import { BookingStatusBadge } from '../src/components/Badge';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { confirmerAnnulation } from '../src/annulation';
import { useI18n } from '../src/i18n';

export default function ProComptoir({ route }) {
  const { t, locale } = useI18n();
  const { salonId } = route.params;
  const [reservations, setReservations] = useState([]);

  const charger = useCallback(async () => {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('bookings')
      .select('*, staff(nom), profiles!bookings_client_id_fkey(nom, prenom)')
      .eq('salon_id', salonId)
      .in('statut', ['en_attente', 'confirme'])
      .gte('date_heure_debut', debut.toISOString())
      .lte('date_heure_debut', fin.toISOString())
      .order('date_heure_debut');
    setReservations(data ?? []);
  }, [salonId]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const changerStatut = async (id, statut) => {
    await supabase.from('bookings').update({ statut }).eq('id', id);
    charger();
  };

  const marquerAcompteRecu = async (booking) => {
    await supabase.from('bookings').update({ acompte_paye: true }).eq('id', booking.id);
    await supabase.from('payments').insert({
      booking_id: booking.id,
      provider: 'especes',
      montant: booking.acompte_montant,
      statut: 'reussi',
    });
    charger();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>{t('agenda.aujourdhui')}</Text>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<EmptyState titre={t('agenda.aucunEnAttente')} icone="✅" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.heure}>
                {new Date(item.date_heure_debut).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <BookingStatusBadge statut={item.statut} />
            </View>
            <Text style={styles.client}>{item.profiles?.prenom} {item.profiles?.nom} · {item.staff?.nom}</Text>

            {item.acompte_montant > 0 && (
              <Text style={styles.acompte}>
                {t('agenda.acompteLigne', {
                  montant: item.acompte_montant,
                  statut: t(item.acompte_paye ? 'agenda.acompteRecuStatut' : 'agenda.acompteAttente'),
                })}
              </Text>
            )}
            {item.acompte_montant > 0 && !item.acompte_paye && (
              <Button title={t('agenda.acompteRecu')} variant="outline" onPress={() => marquerAcompteRecu(item)} />
            )}

            <View style={styles.actions}>
              <Button title={t('agenda.termine')} variant="outline" onPress={() => changerStatut(item.id, 'termine')} style={styles.actionBtn} />
              <Button title={t('agenda.absence')} variant="ghost" onPress={() => changerStatut(item.id, 'no_show')} style={styles.actionBtn} />
              <Button title={t('commun.annuler')} variant="ghost" onPress={() => confirmerAnnulation(t, item, charger)} style={styles.actionBtn} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  titre: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.secondary, marginBottom: spacing.md },
  liste: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md, gap: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heure: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  client: { fontSize: typography.size.sm, color: colors.textSecondary },
  acompte: { fontSize: typography.size.xs, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1 },
});
