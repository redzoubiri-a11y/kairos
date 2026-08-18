import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, StickyBar } from '../../components/Screen';
import SallePhoto from '../../components/SallePhoto';
import MButton from '../../components/MButton';
import { MBadge, SectionTitle, Loader, ErrorState } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { formatNumber } from '../../lib/format';
import * as api from '../../data';

/**
 * Fiche traiteur/halouadji (§13) — même schéma de galerie que `SalleScreen`
 * (photo plein écran + bouton retour superposé), mais sans capacité, carte
 * ni avis : ces deux métiers se contactent par devis, pas par réservation
 * de date. `route.params.type` vaut 'traiteur' ou 'halouadji'.
 */
export default function PartnerScreen({ route, navigation }) {
  const { type, id } = route.params;
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();

  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      const get = type === 'traiteur' ? api.getTraiteur : api.getHalouadji;
      setPartner(await get(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <Loader />
      </Screen>
    );
  }
  if (error || !partner) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const gallery = partner.photos?.length ? partner.photos : [null];
  const hasRange = partner.prix_min != null && partner.prix_max != null;

  return (
    <Screen edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {gallery.map((_, i) => (
              <SallePhoto key={i} salle={partner} index={i} height={sizes.galleryHeight} style={{ width }} />
            ))}
          </ScrollView>

          <View style={{ position: 'absolute', top: spacing.xxl, left: spacing.lg }}>
            <Pressable
              onPress={navigation.goBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={{
                width: 34,
                height: 34,
                borderRadius: radii.pill,
                backgroundColor: 'rgba(255,255,255,0.94)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={19} color="#1A1A1A" />
            </Pressable>
          </View>

          {gallery.length > 1 ? (
            <View style={{ position: 'absolute', bottom: spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 5 }}>
              {gallery.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === photoIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[typography.h3, { color: colors.dark, flex: 1, textAlign: 'left' }]}>{partner.name}</Text>
              {partner.is_premium ? <MBadge label={t('salle.premium')} tone="gold" /> : null}
            </View>
            <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'left' }]}>{partner.city}</Text>
            {hasRange ? (
              <Text style={[typography.title, { fontSize: 17, color: colors.primaryInk, textAlign: 'left' }]}>
                {t(`${type}.priceRange`, {
                  min: formatNumber(partner.prix_min),
                  max: formatNumber(partner.prix_max),
                  currency: t('common.currency'),
                })}
              </Text>
            ) : null}
          </View>

          {partner.description ? (
            <View>
              <SectionTitle title={t(`${type}.description`)} />
              <Text style={[typography.body, { color: colors.dark, textAlign: 'left' }]}>{partner.description}</Text>
            </View>
          ) : null}

          {partner.specialites?.length ? (
            <View>
              <SectionTitle title={t(`${type}.specialites`)} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {partner.specialites.map((s) => (
                  <MBadge key={s} label={t(`specialites.${s}`)} tone="neutral" />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* `StickyBar` est une rangée `space-between` : `full` (alignSelf:
          'stretch') n'étire que la hauteur avec un seul enfant en rangée,
          pas la largeur — il faut `flex: 1` pour occuper toute la barre. */}
      <StickyBar>
        <MButton
          label={t(`${type}.askQuote`)}
          onPress={() => navigation.navigate('DevisRequest', { type, id: partner.id, name: partner.name })}
          style={{ flex: 1 }}
        />
      </StickyBar>
    </Screen>
  );
}
