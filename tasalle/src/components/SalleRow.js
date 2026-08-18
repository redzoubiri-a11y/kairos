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
  const { t } = useI18n();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', opacity: pressed ? 0.92 : 1 })}
      >
        <SallePhoto salle={salle} height={sizes.rowPhoto} style={{ width: sizes.rowPhoto }} />

        <View style={{ flex: 1, padding: spacing.md, gap: spacing.xs, justifyContent: 'space-between' }}>
          <View style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text
                style={[typography.title, { fontSize: 15, color: colors.dark, flex: 1, textAlign: 'left' }]}
                numberOfLines={2}
              >
                {salle.name}
              </Text>

              {onToggleFav ? <View style={{ width: 18, height: 18 }} /> : null}
            </View>

            {salle.rating != null ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={12} color={colors.goldMark} />
                <Text style={[typography.caption, { color: colors.dark }]}>
                  {Number(salle.rating).toFixed(1)}
                </Text>
                <Text style={[typography.caption, { color: colors.warmGray }]}>
                  ({salle.reviews_count})
                </Text>
              </View>
            ) : null}

            <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]} numberOfLines={1}>
              {salle.city} · {t('salle.places', { count: salle.capacity_max })}
            </Text>
          </View>

          <View style={{ gap: spacing.xs }}>
            {salle.price_from != null ? (
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primaryInk, textAlign: 'left' }}>
                {t('common.from')} {formatDA(salle.price_from, t('common.currency'))}
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
              <MBadge label={t('salle.available')} tone="success" size="sm" />
              {salle.is_premium ? <MBadge label={t('salle.promo')} tone="warning" size="sm" /> : null}
            </View>
          </View>
        </View>
      </Pressable>

      {onToggleFav ? (
        <Pressable
          onPress={onToggleFav}
          hitSlop={8}
          accessibilityRole="button"
          style={{ position: 'absolute', top: spacing.md, right: spacing.md }}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? colors.accentInk : colors.warmGray}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
