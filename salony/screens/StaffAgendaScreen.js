import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../supabase';
import { colors, spacing, typography } from '../src/theme';
import { BookingStatusBadge } from '../src/components/Badge';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import EmptyState from '../src/components/EmptyState';
import { useI18n } from '../src/i18n';

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

export default function StaffAgendaScreen() {
  const { t, locale } = useI18n();
  const [date, setDate] = useState(formatDateISO(new Date()));
  const [reservations, setReservations] = useState([]);
  const [rattache, setRattache] = useState(true);

  const charger = useCallback(async () => {
    // les RLS filtrent déjà sur les fiches staff rattachées au compte :
    // inutile (et impossible) de voir les RDV des collègues
    const { data: { user } } = await supabase.auth.getUser();
    const { data: fiches } = await supabase.from('staff').select('id').eq('profile_id', user.id);

    if (!fiches || fiches.length === 0) {
      setRattache(false);
      setReservations([]);
      return;
    }
    setRattache(true);

    const { data } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_client_id_fkey(nom, prenom, telephone), booking_services(nom_snapshot)')
      .gte('date_heure_debut', `${date}T00:00:00`)
      .lte('date_heure_debut', `${date}T23:59:59`)
      .order('date_heure_debut');

    setReservations(data ?? []);
  }, [date]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const changerStatut = async (id, statut) => {
    await supabase.from('bookings').update({ statut }).eq('id', id);
    charger();
  };

  if (!rattache) {
    return (
      <View style={styles.container}>
        <EmptyState
          titre={t('agenda.compteNonRattache')}
          message={t('agenda.compteNonRattacheMessage')}
          icone="🔗"
        />
      </View>
    );
  }

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
            <Text style={styles.services} numberOfLines={1}>
              {item.booking_services?.map((s) => s.nom_snapshot).join(', ')}
            </Text>

            {['en_attente', 'confirme'].includes(item.statut) && (
              <View style={styles.actions}>
                <Button title={t('agenda.termine')} variant="outline" onPress={() => changerStatut(item.id, 'termine')} style={styles.actionBtn} />
                <Button title={t('agenda.absence')} variant="ghost" onPress={() => changerStatut(item.id, 'no_show')} style={styles.actionBtn} />
              </View>
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
  card: { marginBottom: spacing.sm, gap: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heure: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  client: { fontSize: typography.size.sm, color: colors.textPrimary },
  services: { fontSize: typography.size.xs, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1 },
});
