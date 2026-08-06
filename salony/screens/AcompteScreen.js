import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../supabase';
import { colors, spacing, radius, typography } from '../src/theme';
import Card from '../src/components/Card';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

const SATIM_RETURN_HOST = 'salony-retour-paiement';

export default function AcompteScreen({ route, navigation }) {
  const t = useT();
  const { bookingId, montant } = route.params;
  const [formUrl, setFormUrl] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const demarrerPaiementCarte = async () => {
    setChargement(true);
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-satim-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const data = await res.json();
    setChargement(false);

    if (!res.ok) {
      Alert.alert(t('acompte.indisponible'), data.error ?? t('acompte.indisponibleMessage'));
      return;
    }
    setOrderId(data.orderId);
    setFormUrl(data.formUrl);
  };

  const verifierPaiement = async (id) => {
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/satim-webhook?orderId=${id}`
    );
    const data = await res.json();
    setFormUrl(null);

    if (data.succes) {
      Alert.alert(t('acompte.confirme'), t('acompte.confirmeMessage'));
      navigation.navigate('Reservations');
    } else {
      Alert.alert(t('acompte.nonConfirme'), t('acompte.nonConfirmeMessage'));
    }
  };

  const payerSurPlace = () => {
    Alert.alert(t('acompte.reserveTitre'), t('acompte.reserveMessage'));
    navigation.navigate('Reservations');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.recapCard}>
        <Text style={styles.recapLabel}>{t('acompte.demande')}</Text>
        <Text style={styles.recapMontant}>{t('commun.devise', { n: montant })}</Text>
        <Text style={styles.recapNote}>{t('acompte.note')}</Text>
      </Card>

      <Button
        title={t('acompte.payerCarte')}
        onPress={demarrerPaiementCarte}
        loading={chargement}
        style={{ marginTop: spacing.lg }}
      />
      <Button
        title={t('acompte.payerEspeces')}
        variant="outline"
        onPress={payerSurPlace}
        style={{ marginTop: spacing.sm }}
      />

      <Modal visible={!!formUrl} animationType="slide">
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: formUrl }}
            onNavigationStateChange={(navState) => {
              if (navState.url.includes(SATIM_RETURN_HOST) && orderId) {
                verifierPaiement(orderId);
              }
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            )}
          />
          <Button title={t('commun.annuler')} variant="ghost" onPress={() => setFormUrl(null)} style={styles.annulerBtn} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  recapCard: { alignItems: 'center', gap: spacing.xs },
  recapLabel: { fontSize: typography.size.sm, color: colors.textSecondary },
  recapMontant: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary },
  recapNote: { fontSize: typography.size.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  webviewLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  annulerBtn: { margin: spacing.md },
});
