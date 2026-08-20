import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { formatNumber } from '../lib/format';
import SallePhoto from './SallePhoto';
import { MBadge } from './primitives';

/**
 * Carte traiteur/halouadji — même grille que `SalleCard` (§4.1) mais sans
 * capacité ni disponibilité au jour : ces deux métiers se contactent par
 * devis, pas par réservation de date (§13). `SallePhoto` est générique
 * (lit `photos`/`id`/`name`) et se réutilise telle quelle.
 */
export default function PartnerCard({ partner, type, onPress, width }) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useI18n();

  const hasRange = partner.prix_min != null && partner.prix_max != null;

  return (
    <View
      style={{
        width,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        overflow: 'hidden',
      }}
    >
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <SallePhoto salle={partner} height={sizes.cardPhoto} />

        <View style={{ padding: spacing.md, gap: spacing.xs }}>
          <Text style={[typography.title, { fontSize: 15, color: colors.dark, textAlign: 'left' }]} numberOfLines={1}>
            {partner.name}
          </Text>

          <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]} numberOfLines={1}>
            {partner.city}
          </Text>

          {hasRange ? (
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primaryInk, textAlign: 'left' }}>
              {t(`${type}.priceRange`, {
                min: formatNumber(partner.prix_min),
                max: formatNumber(partner.prix_max),
                currency: t('common.currency'),
              })}
            </Text>
          ) : null}

          {partner.is_premium ? (
            <View style={{ flexDirection: 'row', marginTop: 2 }}>
              <MBadge label={t('salle.premium')} tone="gold" size="sm" />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
