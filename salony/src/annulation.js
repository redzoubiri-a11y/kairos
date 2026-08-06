import { Alert } from 'react-native';
import { supabase } from '../supabase';

// Annule une réservation puis, si l'acompte est remboursable, déclenche le
// remboursement. Partagé entre l'écran client et le comptoir pro.
//
// `t` est passé en argument plutôt qu'obtenu par hook : ce module n'est pas un
// composant React et peut être appelé depuis un callback d'Alert.
// Retourne true si l'annulation a bien eu lieu.
export async function annulerReservation(t, bookingId, motif = null) {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_motif: motif,
  });

  if (error) {
    Alert.alert(t('commun.erreur'), error.message);
    return false;
  }

  const resultat = Array.isArray(data) ? data[0] : data;
  if (!resultat?.annule) {
    Alert.alert(t('annulation.impossible'), resultat?.message ?? t('annulation.reessayer'));
    return false;
  }

  if (resultat.acompte_remboursable) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/refund-satim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      }
    );

    if (!res.ok) {
      // la réservation est bien annulée : on n'échoue pas l'opération pour autant
      Alert.alert(
        t('annulation.remboursementEnAttente'),
        t('annulation.remboursementEnAttenteMessage')
      );
      return true;
    }

    const { mode } = await res.json();
    Alert.alert(
      t('annulation.annulee'),
      t(mode === 'especes' ? 'annulation.remboursementEspeces' : 'annulation.remboursementCarte')
    );
    return true;
  }

  // message renvoyé par la RPC : il détaille la règle d'acompte appliquée
  Alert.alert(t('annulation.annulee'), resultat.message);
  return true;
}

// Demande confirmation avant d'annuler, en rappelant la règle d'acompte.
export function confirmerAnnulation(t, booking, onSuccess) {
  const acompteEnJeu = booking.acompte_paye && booking.acompte_montant > 0;

  Alert.alert(
    t('annulation.confirmerTitre'),
    acompteEnJeu
      ? t('annulation.confirmerAvecAcompte', { montant: booking.acompte_montant })
      : t('annulation.confirmerSansAcompte'),
    [
      { text: t('commun.retour'), style: 'cancel' },
      {
        text: t('annulation.confirmerAction'),
        style: 'destructive',
        onPress: async () => {
          const ok = await annulerReservation(t, booking.id);
          if (ok) onSuccess?.();
        },
      },
    ]
  );
}
