import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Body } from '../../components/Screen';
import MInput from '../../components/MInput';
import MButton from '../../components/MButton';
import { KeyValue } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import * as api from '../../data';
import { useGoBack } from '../../lib/navigation';

/**
 * Demande de devis (§13) — un seul écran, pas d'étapes : contrairement à
 * une réservation de salle, aucune date n'est bloquée, donc pas besoin du
 * calendrier de `BookingScreen`. Juste une date indicative, un nombre
 * d'invités et un message ; le professionnel répond de son côté.
 */
export default function DevisRequestScreen({ route, navigation }) {
  const goBack = useGoBack(navigation);
  const { type, id, name } = route.params;
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  const [eventDate, setEventDate] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!guestCount) {
      setError(t('devis.errorGuests'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.createDevisRequest({
        [type === 'traiteur' ? 'traiteurId' : 'halouadjiId']: id,
        eventDate: eventDate || null,
        guestCount,
        message,
      });
      setSent(true);
    } catch (e) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <Body>
          <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: radii.pill,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={40} color={colors.primaryInk} />
            </View>
            <Text style={[typography.h2, { color: colors.dark, textAlign: 'center' }]}>
              {t('devis.successTitle')}
            </Text>
            <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'center' }]}>
              {t('devis.successBody')}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.xl,
              padding: spacing.lg,
            }}
          >
            <KeyValue label={t(`${type}.singular`)} value={name} />
            {eventDate ? <KeyValue label={t('devis.eventDate')} value={eventDate} /> : null}
            <KeyValue label={t('devis.guestCount')} value={guestCount} />
          </View>

          <MButton label={t('devis.backHome')} variant="ghost" size="lg" full onPress={() => navigation.popToTop()} />
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={t('devis.title')} subtitle={name} onBack={goBack} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, padding: spacing.xl, gap: spacing.lg }}>
        <MInput
          label={t('devis.eventDate')}
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="AAAA-MM-JJ"
          keyboardType="number-pad"
          textContentType="none"
          direction="ltr"
          hint={t('common.optional')}
        />

        <MInput
          label={t('devis.guestCount')}
          value={guestCount}
          onChangeText={(v) => setGuestCount(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          textContentType="none"
          direction="ltr"
          suffix={t('common.guests')}
          error={error}
        />

        <MInput
          label={t('devis.message')}
          value={message}
          onChangeText={setMessage}
          placeholder={t('devis.messagePlaceholder')}
          multiline
        />

        <MButton label={t('devis.send')} onPress={submit} loading={loading} size="lg" full />
      </KeyboardAvoidingView>
    </Screen>
  );
}
