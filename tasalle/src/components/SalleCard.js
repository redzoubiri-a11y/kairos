import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../i18n';
import { formatDA } from '../lib/format';
import SallePhoto from './SallePhoto';
import { MBadge } from './primitives';

/** Pastille de note superposée en haut de la photo (§4.1). */
function RatingOverlay({ rating }) {
  const { colors, radii } = useTheme();
  if (rating == null) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: radii.sm,
        paddingHorizontal: 6,
        paddingVertical: 3,
      }}
    >
      <Ionicons name="star" size={11} color={colors.goldMark} />
      <Text style={{ fontSize: 11, fontWeight: '500', color: '#1A1A1A' }}>{Number(rating).toFixed(1)}</Text>
    </View>
  );
}

function FavButton({ active, onPress }) {
  const { colors, radii } = useTheme();
  if (!onPress) return null;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(255,255,255,0.94)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={active ? 'heart' : 'heart-outline'} size={15} color={active ? colors.accent : '#1A1A1A'} />
    </Pressable>
  );
}

/**
 * Carte salle verticale — grille d'accueil (§4.1).
 * Photo 140px, badge note, nom, ville · capacité · avis, prix, badges.
 */
export default function SalleCard({ salle, onPress, onToggleFav, isFav, width }) {
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.xl,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <SallePhoto salle={salle} height={sizes.cardPhoto}>
        <RatingOverlay rating={salle.rating} />
        <FavButton active={isFav} onPress={onToggleFav} />
      </SallePhoto>

      <View style={{ padding: spacing.md, gap: spacing.xs }}>
        <Text style={[typography.title, { fontSize: 15, color: colors.dark, textAlign: 'left' }]} numberOfLines={1}>
          {salle.name}
        </Text>

        <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]} numberOfLines={1}>
          {salle.city} · {t('salle.places', { count: salle.capacity_max })}
          {salle.reviews_count ? ` · ${t('salle.reviewsCount', { count: salle.reviews_count })}` : ''}
        </Text>

        {salle.price_from != null ? (
          <Text style={{ fontSize: 15, fontWeight: '500', color: colors.primaryInk, textAlign: 'left' }}>
            {t('common.from')} {formatDA(salle.price_from, t('common.currency'))}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginTop: 2 }}>
          <MBadge label={t('salle.available')} tone="success" size="sm" />
          {salle.is_premium ? <MBadge label={t('salle.premium')} tone="gold" size="sm" /> : null}
        </View>
      </View>
    </Pressable>
  );
}
