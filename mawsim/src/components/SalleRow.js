import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { formatDA } from '../lib/format';
import SallePhoto from './SallePhoto';
import { MBadge } from './primitives';

/**
 * Carte salle horizontale — écran de recherche (§4.2).
 * Photo carrée 140px à gauche (droite en RTL), informations à côté.
 */
export default function SalleRow({ salle, onPress, onToggleFav, isFav }) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t, dir, align } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: dir,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.xl,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <SallePhoto salle={salle} height={sizes.rowPhoto} style={{ width: sizes.rowPhoto }} />

      <View style={{ flex: 1, padding: spacing.md, gap: spacing.xs, justifyContent: 'space-between' }}>
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: dir, alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
            <Text
              style={[typography.title, { fontSize: 15, color: colors.dark, flex: 1, textAlign: align }]}
              numberOfLines={2}
            >
              {salle.name}
            </Text>

            {onToggleFav ? (
              <Pressable onPress={onToggleFav} hitSlop={8} accessibilityRole="button">
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFav ? colors.accent : colors.warmGray}
                />
              </Pressable>
            ) : null}
          </View>

          {salle.rating != null ? (
            <View style={{ flexDirection: dir, alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={12} color={colors.gold} />
              <Text style={[typography.caption, { color: colors.dark }]}>
                {Number(salle.rating).toFixed(1)}
              </Text>
              <Text style={[typography.caption, { color: colors.warmGray }]}>
                ({salle.reviews_count})
              </Text>
            </View>
          ) : null}

          <Text style={[typography.caption, { color: colors.warmGray, textAlign: align }]} numberOfLines={1}>
            {salle.city} · {t('salle.places', { count: salle.capacity_max })}
          </Text>
        </View>

        <View style={{ gap: spacing.xs }}>
          {salle.price_from != null ? (
            <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primary, textAlign: align }}>
              {t('common.from')} {formatDA(salle.price_from, t('common.currency'))}
            </Text>
          ) : null}

          <View style={{ flexDirection: dir, gap: spacing.xs, flexWrap: 'wrap' }}>
            <MBadge label={t('salle.available')} tone="success" size="sm" />
            {salle.is_premium ? <MBadge label={t('salle.promo')} tone="warning" size="sm" /> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
