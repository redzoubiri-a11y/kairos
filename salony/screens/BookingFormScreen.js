import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import TimeSlotButton from '../src/components/TimeSlotButton';
import Button from '../src/components/Button';
import { useI18n } from '../src/i18n';

function formatDateISO(date) {
  return date.toISOString().split('T')[0];
}

export default function BookingFormScreen({ route, navigation }) {
  const { t, locale } = useI18n();
  const { salonId, services, staff } = route.params;
  const dureeTotale = services.reduce((acc, s) => acc + s.duree_min, 0);
  const prixTotal = services.reduce((acc, s) => acc + Number(s.prix), 0);

  const [dateSelectionnee, setDateSelectionnee] = useState(formatDateISO(new Date()));
  const [creneaux, setCreneaux] = useState([]);
  const [creneauChoisi, setCreneauChoisi] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const chargerCreneaux = useCallback(async () => {
    setChargement(true);
    setCreneauChoisi(null);

    // "Sans préférence" (staff.id null) : la RPC salon agrège les
    // disponibilités de toute l'équipe et retourne le praticien retenu
    // pour chaque créneau. Sinon on interroge le praticien choisi.
    const { data, error } = staff.id
      ? await supabase.rpc('get_available_slots', {
          p_staff_id: staff.id,
          p_date: dateSelectionnee,
          p_duree_min: dureeTotale,
        })
      : await supabase.rpc('get_salon_available_slots', {
          p_salon_id: salonId,
          p_date: dateSelectionnee,
          p_duree_min: dureeTotale,
          p_service_ids: services.map((s) => s.id),
        });

    if (!error) setCreneaux(data ?? []);
    setChargement(false);
  }, [dateSelectionnee, staff.id, dureeTotale, salonId, services]);

  useEffect(() => { chargerCreneaux(); }, [chargerCreneaux]);

  const acompteTotal = services.reduce((acc, s) => acc + Number(s.acompte_requis ?? 0), 0);

  const confirmerReservation = async () => {
    if (!creneauChoisi) return;
    setEnvoi(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        salon_id: salonId,
        // en mode "sans préférence", le praticien vient du créneau résolu
        staff_id: staff.id ?? creneauChoisi.staff_id,
        date_heure_debut: creneauChoisi.slot_debut,
        date_heure_fin: creneauChoisi.slot_fin,
        acompte_montant: acompteTotal,
      })
      .select()
      .single();

    if (error) {
      setEnvoi(false);
      // la contrainte d'exclusion en base a rejeté un chevauchement :
      // on rafraîchit la liste pour refléter l'état réel
      Alert.alert(t('reservation.creneauIndisponible'), t('reservation.creneauIndisponibleMessage'));
      chargerCreneaux();
      return;
    }

    await supabase.from('booking_services').insert(
      services.map((s) => ({
        booking_id: booking.id,
        service_id: s.id,
        nom_snapshot: s.nom,
        prix_snapshot: s.prix,
        duree_snapshot: s.duree_min,
      }))
    );

    setEnvoi(false);

    if (acompteTotal > 0) {
      navigation.navigate('Acompte', { bookingId: booking.id, montant: acompteTotal });
    } else {
      navigation.navigate('Reservations');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Calendar
          minDate={formatDateISO(new Date())}
          onDayPress={(day) => setDateSelectionnee(day.dateString)}
          markedDates={{ [dateSelectionnee]: { selected: true, selectedColor: colors.primary } }}
          theme={{
            todayTextColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            arrowColor: colors.primary,
          }}
        />

        <Text style={styles.sectionTitre}>{t('reservation.creneauxDisponibles')}</Text>
        <View style={styles.slotsGrid}>
          {!chargement && creneaux.length === 0 && (
            <Text style={styles.aucunCreneau}>{t('reservation.aucunCreneau')}</Text>
          )}
          {creneaux.map((c) => (
            <TimeSlotButton
              key={c.slot_debut}
              heure={new Date(c.slot_debut).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              selected={creneauChoisi?.slot_debut === c.slot_debut}
              onPress={() => setCreneauChoisi(c)}
            />
          ))}
        </View>

        {!staff.id && creneauChoisi?.staff_nom && (
          <Text style={styles.praticienResolu}>
            {t('reservation.praticienResolu', { nom: creneauChoisi.staff_nom })}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPrix}>{t('commun.devise', { n: prixTotal })}</Text>
          <Text style={styles.footerDuree}>{t('commun.minutes', { n: dureeTotale })}</Text>
        </View>
        <Button
          title={t('reservation.confirmer')}
          disabled={!creneauChoisi}
          loading={envoi}
          onPress={confirmerReservation}
          style={{ flex: 1, marginStart: spacing.md }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitre: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: colors.textPrimary, margin: spacing.md },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md },
  aucunCreneau: { color: colors.textSecondary, fontSize: typography.size.sm },
  praticienResolu: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerPrix: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  footerDuree: { fontSize: typography.size.xs, color: colors.textSecondary },
});
