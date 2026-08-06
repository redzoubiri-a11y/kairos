import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import { BookingStatusBadge } from '../src/components/Badge';
import EmptyState from '../src/components/EmptyState';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { confirmerAnnulation } from '../src/annulation';
import { useI18n } from '../src/i18n';

export default function ReservationsScreen({ navigation }) {
  const { t, locale } = useI18n();
  const [reservations, setReservations] = useState([]);

  const charger = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('bookings')
      .select('*, salons(nom), staff(nom), booking_services(nom_snapshot, prix_snapshot), reviews(id)')
      .eq('client_id', user.id)
      .order('date_heure_debut', { ascending: false });
    setReservations(data ?? []);
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const estAnnulable = (booking) =>
    ['en_attente', 'confirme'].includes(booking.statut) &&
    new Date(booking.date_heure_debut) > new Date();

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={
          <EmptyState titre={t('reservations.aucune')} message={t('reservations.aucuneMessage')} icone="📅" />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.salonNom}>{item.salons?.nom}</Text>
              <BookingStatusBadge statut={item.statut} />
            </View>
            <Text style={styles.date}>
              {new Date(item.date_heure_debut).toLocaleString(locale, {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            <Text style={styles.staff}>{t('reservations.avec', { nom: item.staff?.nom })}</Text>
            <Text style={styles.services} numberOfLines={1}>
              {item.booking_services?.map((s) => s.nom_snapshot).join(', ')}
            </Text>

            {item.acompte_montant > 0 && (
              <Text style={styles.acompte}>
                {t('reservations.acompteStatut', {
                  montant: item.acompte_montant,
                  statut: t(item.acompte_paye ? 'reservations.acomptePaye' : 'reservations.acompteNonRegle'),
                })}
              </Text>
            )}

            {estAnnulable(item) && (
              <Button
                title={t('reservations.annuler')}
                variant="outline"
                onPress={() => confirmerAnnulation(t, item, charger)}
                style={styles.annulerBtn}
              />
            )}

            {item.statut === 'termine' && (
              item.reviews?.length > 0 ? (
                <Text style={styles.avisDepose}>{t('reservations.avisDepose')}</Text>
              ) : (
                <Button
                  title={t('reservations.laisserAvis')}
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('ReviewForm', {
                      bookingId: item.id,
                      salonId: item.salon_id,
                      salonNom: item.salons?.nom,
                    })
                  }
                  style={styles.annulerBtn}
                />
              )
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  liste: { padding: spacing.md },
  card: { marginBottom: spacing.md, gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  salonNom: { fontSize: typography.size.md, fontWeight: typography.weight.semibold, color: colors.textPrimary },
  date: { fontSize: typography.size.sm, color: colors.textPrimary, textTransform: 'capitalize' },
  staff: { fontSize: typography.size.sm, color: colors.textSecondary },
  services: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: spacing.xs },
  acompte: { fontSize: typography.size.xs, color: colors.textSecondary },
  annulerBtn: { marginTop: spacing.sm },
  avisDepose: { fontSize: typography.size.xs, color: colors.success, marginTop: spacing.sm },
});
