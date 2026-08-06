import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../supabase';
import { colors, spacing, typography } from '../src/theme';
import { BookingStatusBadge } from '../src/components/Badge';
import Card from '../src/components/Card';
import EmptyState from '../src/components/EmptyState';
import { useI18n } from '../src/i18n';

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

export default function ProAgenda({ route }) {
  const { t, locale } = useI18n();
  const { salonId } = route.params;
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [reservations, setReservations] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const debut = `${date}T00:00:00`;
        const fin = `${date}T23:59:59`;
        const { data } = await supabase
          .from('bookings')
          .select('*, staff(nom), profiles!bookings_client_id_fkey(nom, prenom, telephone)')
          .eq('salon_id', salonId)
          .gte('date_heure_debut', debut)
          .lte('date_heure_debut', fin)
          .order('date_heure_debut');
        setReservations(data ?? []);
      })();
    }, [salonId, date])
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setDate(day.dateString)}
        markedDates={{ [date]: { selected: true, selectedColor: colors.primary } }}
        theme={{ todayTextColor: colors.primary, selectedDayBackgroundColor: colors.primary, arrowColor: colors.primary }}
      />
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<EmptyState titre={t('agenda.aucunRdv')} icone="🗓️" />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.heure}>
                {new Date(item.date_heure_debut).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <BookingStatusBadge statut={item.statut} />
            </View>
            <Text style={styles.client}>{item.profiles?.prenom} {item.profiles?.nom}</Text>
            <Text style={styles.staff}>{t('reservations.avec', { nom: item.staff?.nom })}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  liste: { padding: spacing.md },
  card: { marginBottom: spacing.sm, gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heure: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  client: { fontSize: typography.size.sm, color: colors.textPrimary },
  staff: { fontSize: typography.size.xs, color: colors.textSecondary },
});
