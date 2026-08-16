import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import useRestaurant from '../src/hooks/useRestaurant';
import PhotoCarouselHero from '../src/components/PhotoCarouselHero';
import RestaurantInfosTab from '../src/components/RestaurantInfosTab';
import RestaurantMenuTab from '../src/components/RestaurantMenuTab';
import RestaurantAvisTab from '../src/components/RestaurantAvisTab';
import RestaurantPhotosTab from '../src/components/RestaurantPhotosTab';

const TABS = ['Infos', 'Menu', 'Avis', 'Photos'];
// La maquette utilise un hero plus haut sur Infos (onglet d'atterrissage) et plus
// compact sur les 3 autres, pour laisser plus de place au contenu.
const HERO_INFOS = 280;
const HERO_OTHER = 200;

export default function RestaurantScreen({ route, navigation }) {
  const restaurantParam = route?.params?.restaurant || {};
  const {
    restaurant, tab, reviews, loadingReviews,
    tabAnim, photos, menu, rating, cuisineEmoji, desc,
    switchTab, clickCollectEnabled,
  } = useRestaurant(restaurantParam);

  // Sélection sur le widget "Réservation en ligne" — reflète le libellé du CTA,
  // mais n'est pas encore transmise au formulaire de réservation (pas de prefill
  // côté useReservationForm pour l'instant, cf. résumé du lot).
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const goReserve = useCallback(() => navigation.navigate('ReservationForm', { restaurant }), [navigation, restaurant]);
  const goClickCollect = useCallback(() => navigation.navigate('ClickCollect', { restaurant }), [navigation, restaurant]);

  const reviewCount = restaurant.review_count || reviews.length;
  const amenities = [
    restaurant.terrasse && 'Terrasse',
    restaurant.parking && 'Parking',
    restaurant.espace_famille && 'Espace famille',
    restaurant.salle_fete && 'Salle fête',
  ].filter(Boolean);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <PhotoCarouselHero
        restaurant={{ ...restaurant, photos }}
        height={tab === 'Infos' ? HERO_INFOS : HERO_OTHER}
        onBack={() => navigation.goBack()}
        emptyIcon={cuisineEmoji}
      />

      <Animated.ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, opacity: tabAnim }}>
        <View style={s.headBlock}>
          <Text style={s.name} numberOfLines={2}>{restaurant.name}</Text>

          {!!rating && (
            <View style={s.rateline}>
              <Text style={s.stars}>{'★'.repeat(Math.max(1, Math.min(5, Math.round(Number(rating)))))}</Text>
              <Text style={s.scoreNum}>{rating.replace('.', ',')}</Text>
              {reviewCount > 0 && <Text style={s.reviewCt}>({reviewCount} avis)</Text>}
            </View>
          )}

          <Text style={s.meta} numberOfLines={1}>
            {[(restaurant.cuisine_type || '').replace(/_/g, ' '), [restaurant.quartier, restaurant.city].filter(Boolean).join(', ')]
              .filter(Boolean).join(' · ')}
          </Text>

          {amenities.length > 0 && (
            <View style={s.tags}>
              {amenities.map(a => (
                <View key={a} style={s.tag}><Text style={s.tagTxt}>{a}</Text></View>
              ))}
            </View>
          )}

          <View style={s.tabBar}>
            {TABS.map(t => (
              <TouchableOpacity key={t} onPress={() => switchTab(t)}>
                <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {tab === 'Infos' && (
          <RestaurantInfosTab
            restaurant={restaurant} desc={desc}
            selectedDateIdx={selectedDateIdx} onSelectDate={setSelectedDateIdx}
            selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot}
          />
        )}
        {tab === 'Menu' && <RestaurantMenuTab menu={menu} />}
        {tab === 'Avis' && <RestaurantAvisTab restaurant={restaurant} reviews={reviews} loadingReviews={loadingReviews} />}
        {tab === 'Photos' && <RestaurantPhotosTab photos={photos} />}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity style={s.cta} onPress={goReserve} activeOpacity={0.9}>
          <Text style={s.ctaTxt}>
            {selectedSlot ? `Réserver — ${selectedSlot}, 2 pers.` : 'Réserver une table'}
          </Text>
        </TouchableOpacity>
        {clickCollectEnabled && (
          <TouchableOpacity style={s.ccBtn} onPress={goClickCollect} activeOpacity={0.85}>
            <Text style={s.ccTxt}>Commander</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },

  headBlock: { paddingHorizontal: spacing.xl },
  name:    { fontFamily: typography.display, fontSize: typography.size.title - 4, color: colors.text, marginTop: spacing.lg, letterSpacing: -0.2 },
  rateline:{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, marginTop: spacing.sm - 1 },
  stars:   { color: colors.star, fontSize: typography.size.bodyLg, letterSpacing: 1 },
  scoreNum:{ fontFamily: typography.display, fontSize: typography.size.subheading, color: colors.text },
  reviewCt:{ fontFamily: typography.body, fontSize: typography.size.caption, color: colors.textDim },
  meta:    { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textMuted, marginTop: spacing.sm - 1, textTransform: 'capitalize' },

  tags:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginTop: spacing.lg - 2 },
  tag:    { paddingHorizontal: spacing.md + 1, paddingVertical: spacing.xs + 1, borderRadius: radius.sm + 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tagTxt: { fontFamily: typography.bodyMedium, fontSize: typography.size.caption - 0.5, color: colors.textMuted },

  tabBar: { flexDirection: 'row', gap: spacing.xxl - 2, marginTop: spacing.xxl - 4, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabTxt: { fontFamily: typography.bodyBold, fontSize: typography.size.bodyLg - 0.5, color: colors.textDim, paddingBottom: spacing.sm + 1 },
  tabTxtOn: { color: colors.text, borderBottomWidth: 2, borderBottomColor: colors.primary },

  bottomBar: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg - 1, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.card },
  cta:    { height: 50, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.subheading },
  ccBtn:  { marginTop: spacing.sm + 2, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  ccTxt:  { fontFamily: typography.bodySemibold, color: colors.text, fontSize: typography.size.body },
});
