import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, StickyBar } from '../../components/Screen';
import SallePhoto from '../../components/SallePhoto';
import SalleMap from '../../components/SalleMap';
import MButton from '../../components/MButton';
import ReviewCard, { RatingBreakdown } from '../../components/ReviewCard';
import { MBadge, MChip, SectionTitle, Loader, ErrorState, Divider } from '../../components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { useFavorites } from '../../context/FavoritesContext';
import { formatDA } from '../../lib/format';
import { AMENITY_ICONS, EVENT_TYPES } from '../../lib/constants';
import { distanceKm, formatDistance } from '../../lib/geo';
import { getUserPosition, getCachedPosition } from '../../services/location';
import * as api from '../../data';
import { useGoBack } from '../../lib/navigation';

function QuickStat({ icon, value, label }) {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: spacing.md }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.md,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 2,
        }}
      >
        <Ionicons name={icon} size={16} color={colors.primaryInk} />
      </View>
      <Text style={[typography.secondary, { color: colors.dark, fontWeight: '500' }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[typography.caption, { color: colors.warmGray }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function SalleScreen({ route, navigation }) {
  const goBack = useGoBack(navigation);
  const { id } = route.params;
  const { colors, typography, spacing, radii, sizes } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { isFav, toggle } = useFavorites();
  const { width } = useWindowDimensions();

  const [salle, setSalle] = useState(null);
  const [reviews, setReviews] = useState([]);
  // Galerie des clients : constituée sur l'ensemble des avis publiés, pour
  // qu'un filtre par type d'événement ne la vide pas.
  const [clientPhotos, setClientPhotos] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [position, setPosition] = useState(getCachedPosition());

  const load = useCallback(async () => {
    try {
      setError(null);
      const [s, r] = await Promise.all([api.getSalle(id), api.getSalleReviews(id, {})]);
      setSalle(s);
      setReviews(r);
      setClientPhotos(r.flatMap((review) => review.photos || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // La distance est un confort : on ne demande la position qu'une fois, et
  // son absence ne bloque rien.
  useEffect(() => {
    if (position) return;
    getUserPosition().then((p) => p && setPosition(p));
  }, [position]);

  useEffect(() => {
    if (!salle) return;
    api
      .getSalleReviews(id, { eventType: reviewFilter })
      .then(setReviews)
      .catch(() => {});
  }, [reviewFilter, id, salle]);

  if (loading) {
    return (
      <Screen>
        <Loader />
      </Screen>
    );
  }
  if (error || !salle) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  const gallery = salle.photos?.length ? salle.photos : [null];
  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 3);
  const fav = isFav(salle.id);

  return (
    <Screen edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* 1 — Galerie photos */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {gallery.map((_, i) => (
              <SallePhoto key={i} salle={salle} index={i} height={sizes.galleryHeight} style={{ width }} />
            ))}
          </ScrollView>

          <View style={{ position: 'absolute', top: Math.max(insets.top + spacing.md, spacing.xxl), left: spacing.lg, right: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={{
                width: 34, height: 34, borderRadius: radii.pill,
                backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={19} color="#1A1A1A" />
            </Pressable>

            <Pressable
              onPress={() => toggle(salle.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: fav }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, height: 34, borderRadius: radii.sm,
                backgroundColor: 'rgba(255,255,255,0.94)',
              }}
            >
              <Ionicons name={fav ? 'heart' : 'heart-outline'} size={16} color={fav ? colors.accentInk : '#1A1A1A'} />
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#1A1A1A' }}>
                {fav ? t('salle.saved') : t('salle.save')}
              </Text>
            </Pressable>
          </View>

          {gallery.length > 1 ? (
            <View style={{ position: 'absolute', bottom: spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 5 }}>
              {gallery.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === photoIndex ? 16 : 6, height: 6, borderRadius: 3,
                    backgroundColor: i === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.xl }}>
          {/* 2 — En-tête */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[typography.h2, { color: colors.dark, textAlign: 'left' }]}>{salle.name}</Text>
              <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'left' }]}>
                {salle.address || salle.city}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: 2 }}>
                <MBadge label={t('salle.available')} tone="success" size="sm" />
                {salle.is_premium ? <MBadge label={t('salle.premium')} tone="gold" size="sm" /> : null}
              </View>
            </View>

            {salle.price_from != null ? (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.caption, { color: colors.warmGray }]}>{t('common.from')}</Text>
                <Text style={[typography.h3, { color: colors.primaryInk }]}>
                  {formatDA(salle.price_from, t('common.currency'))}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 3 — Stats rapides */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radii.xl,
            }}
          >
            <QuickStat icon="star" value={salle.rating ? Number(salle.rating).toFixed(1) : '—'} label={t('salle.rating')} />
            <QuickStat
              icon="people-outline"
              value={salle.capacity_max ? String(salle.capacity_max) : '—'}
              label={t('salle.capacity')}
            />
            <QuickStat
              icon="car-outline"
              value={salle.parking_places ? String(salle.parking_places) : '—'}
              label={t('salle.parking')}
            />
            <QuickStat
              icon="location-outline"
              value={formatDistance(distanceKm(position, salle)) ?? '—'}
              label={t('salle.distance')}
            />
          </View>

          {/* 4 — Description */}
          {salle.description ? (
            <View>
              <SectionTitle title={t('salle.description')} />
              <Text style={[typography.body, { color: colors.warmGray, textAlign: 'left' }]}>
                {salle.description}
              </Text>
            </View>
          ) : null}

          {/* 5 — Situation (§1.3) */}
          {salle.latitude != null ? (
            <View>
              <SectionTitle title={t('salle.location')} />
              <SalleMap salle={salle} />
            </View>
          ) : null}

          {/* 6 — Équipements */}
          {salle.amenities?.length ? (
            <View>
              <SectionTitle title={t('salle.amenities')} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                {salle.amenities.map((a) => (
                  <View
                    key={a}
                    style={{
                      width: '30%',
                      alignItems: 'center',
                      gap: 5,
                      paddingVertical: spacing.md,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                    }}
                  >
                    <Ionicons name={AMENITY_ICONS[a] || 'ellipse-outline'} size={18} color={colors.primaryInk} />
                    <Text style={[typography.caption, { color: colors.dark, textAlign: 'center' }]} numberOfLines={2}>
                      {t(`amenities.${a}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 6 — Formules & tarifs */}
          {salle.tarifs?.length ? (
            <View>
              <SectionTitle title={t('salle.formulas')} />
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  paddingHorizontal: spacing.lg,
                }}
              >
                {salle.tarifs.map((tarif, i) => (
                  <View key={tarif.id}>
                    {i > 0 ? <Divider /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[typography.secondary, { color: colors.dark, fontWeight: '500', textAlign: 'left' }]}>
                          {tarif.name}
                        </Text>
                        {tarif.description ? (
                          <Text style={[typography.caption, { color: colors.warmGray, textAlign: 'left' }]}>
                            {tarif.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[typography.title, { fontSize: 15, color: colors.primaryInk }]}>
                        {formatDA(tarif.price, t('common.currency'))}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 7 — Galerie des photos clients (§7.3) */}
          {clientPhotos.length ? (
            <View>
              <SectionTitle title={t('salle.clientPhotos', { count: clientPhotos.length })} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, flexDirection: 'row' }}
              >
                {clientPhotos.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={{ width: 118, height: 88, borderRadius: radii.lg }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* 8 — Avis clients */}
          <View>
            <SectionTitle title={t('salle.reviews')} />

            {reviews.length === 0 && reviewFilter === 'all' ? (
              <Text style={[typography.secondary, { color: colors.warmGray, textAlign: 'left' }]}>
                {t('salle.noReviews')}
              </Text>
            ) : (
              <View style={{ gap: spacing.lg }}>
                {reviewFilter === 'all' ? <RatingBreakdown reviews={reviews} /> : null}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm, flexDirection: 'row' }}
                >
                  <MChip
                    label={t('reviews.filterAll')}
                    active={reviewFilter === 'all'}
                    onPress={() => setReviewFilter('all')}
                  />
                  {EVENT_TYPES.filter((x) => x !== 'autre').map((type) => (
                    <MChip
                      key={type}
                      label={t(`events.${type}`)}
                      active={reviewFilter === type}
                      onPress={() => setReviewFilter(type)}
                    />
                  ))}
                </ScrollView>

                {shownReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}

                {reviews.length > 3 && !showAllReviews ? (
                  <MButton
                    label={t('salle.showAllReviews', { count: reviews.length })}
                    variant="ghost"
                    onPress={() => setShowAllReviews(true)}
                    full
                  />
                ) : null}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 8 — Barre collée en bas */}
      <StickyBar>
        {/* Une salle réelle pas encore revendiquée n'a ni tarifs ni formules :
            proposer « Réserver » mènerait à une étape « Formule » vide. */}
        <View>
          {salle.price_from != null ? (
            <>
              <Text style={[typography.caption, { color: colors.warmGray }]}>{t('common.from')}</Text>
              <Text style={[typography.title, { color: colors.dark }]}>
                {formatDA(salle.price_from, t('common.currency'))}
              </Text>
            </>
          ) : (
            <Text style={[typography.caption, { color: colors.warmGray }]}>
              {t('common.priceOnRequest')}
            </Text>
          )}
        </View>
        <MButton
          label={salle.tarifs?.length ? t('salle.bookNow') : t('booking.noFormulasTitle')}
          disabled={!salle.tarifs?.length}
          size="lg"
          onPress={() => navigation.navigate('Booking', { salleId: salle.id })}
          style={{ flex: 1 }}
        />
      </StickyBar>
    </Screen>
  );
}
