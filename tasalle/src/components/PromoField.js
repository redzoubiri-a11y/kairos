import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MInput from './MInput';
import MButton from './MButton';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { formatDA } from '../lib/format';
import * as api from '../data';

/**
 * Saisie d'un code promo pendant la réservation (§12 Phase 4).
 *
 * La vérification passe par le serveur, jamais par un calcul local : le
 * montant remisé qui sera facturé est recalculé à l'envoi de la demande, et
 * cet écran ne fait qu'en donner l'aperçu.
 *
 * `onApplied` reçoit `{ code, discount, total }`, ou `null` au retrait.
 */
export default function PromoField({ salleId, amount, applied, onApplied }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const verifier = async () => {
    const saisi = code.trim();
    if (!saisi || busy) return;

    setBusy(true);
    setError(null);
    try {
      const verdict = await api.checkPromoCode(salleId, saisi, amount);
      onApplied({ code: verdict.code, discount: verdict.discount, total: verdict.total });
      setCode('');
    } catch (e) {
      // Chaque refus a sa raison : « épuisé » et « expiré » n'appellent pas la
      // même réaction chez le client.
      setError(t(`booking.promoErrors.${e.reason || 'unknown'}`));
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primaryLight,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Ionicons name="pricetag" size={15} color={colors.primaryInk} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.secondary, { color: colors.primaryInk }]}>
            {t('booking.promoApplied', { code: applied.code })}
          </Text>
          <Text style={[typography.caption, { color: colors.warmGray }]}>
            −{formatDA(applied.discount, t('common.currency'))}
          </Text>
        </View>
        <Pressable
          onPress={() => onApplied(null)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('booking.promoRemove')}
        >
          <Ionicons name="close-circle" size={19} color={colors.warmGray} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        <MInput
          label={t('booking.promoLabel')}
          value={code}
          onChangeText={(v) => {
            setCode(v.toUpperCase());
            setError(null);
          }}
          placeholder={t('booking.promoPlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          direction="ltr"
          icon="pricetag-outline"
          style={{ flex: 1 }}
          onSubmitEditing={verifier}
        />
        <MButton
          label={t('booking.promoApply')}
          variant="secondary"
          onPress={verifier}
          loading={busy}
          disabled={!code.trim()}
        />
      </View>

      {error ? (
        <Text style={[typography.caption, { color: colors.accent, textAlign: 'left' }]}>{error}</Text>
      ) : null}
    </View>
  );
}
