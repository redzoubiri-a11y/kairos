import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import useRestaurant from '../src/hooks/useRestaurant';
import PhotoCarouselHero from '../src/components/PhotoCarouselHero';
import RestaurantMenuTab from '../src/components/RestaurantMenuTab';
import RestaurantAvisTab from '../src/components/RestaurantAvisTab';
import RestaurantInfosTab, { todaysHours, isOpenNow } from '../src/components/RestaurantInfosTab';
import Tag from '../src/components/Tag';

const HERO = 310;

export default function RestaurantScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {};

  const {
    tab, reviews, loadingReviews,
    tabAnim, photos, menu, rating, cuisineEmoji, desc,
    switchTab, clickCollectEnabled,
  } = useRestaurant(restaurant);

  const todaysRange = todaysHours(restaurant.opening_hours);
  const openNow = isOpenNow(restaurant.opening_hours);

  const goReserve = useCallback(() => navigation.navigate('ReservationForm', { restaurant }), [navigation, restaurant]);
  const goClickCollect = useCallback(() => navigation.navigate('ClickCollect', { restaurant }), [navigation, restaurant]);
  const goDirections = useCallback(() => {
    const query = restaurant.latitude && restaurant.longitude
      ? `${restaurant.latitude},${restaurant.longitude}`
      : restaurant.address || restaurant.quartier || restaurant.name;
    if (!query) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }, [restaurant]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient colors={colors.photoFallbackGradient} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />

      {/* Hero — photo propre, aucun texte dessus */}
      <PhotoCarouselHero
        restaurant={{ ...restaurant, photos }}
        height={HERO}
        onBack={() => navigation.goBack()}
        emptyIcon={cuisineEmoji}
      />

      {/* Infos — sous la photo, plus aucun texte sur l'image */}
      <View style={s.infoBlock}>
        <Text style={s.infoName} numberOfLines={2}>{restaurant.name}</Text>
        <View style={s.infoMetaRow}>
          {rating && (
            <>
              <Text style={s.infoRating}>★ {rating}</Text>
              {restaurant.review_count > 0 && (
                <Text style={s.infoReviewCount}>({restaurant.review_count} avis)</Text>
              )}
              <Text style={s.infoSep}>·</Text>
            </>
          )}
          <Text style={s.infoCuisine} numberOfLines={1}>
            {cuisineEmoji} {(restaurant.cuisine_type || '').replace(/_/g, ' ')}
          </Text>
        </View>
        <View style={s.infoAddrRow}>
          <Ionicons name="location-outline" size={14} color={colors.textDim} />
          <Text style={s.infoAddr} numberOfLines={1}>
            {restaurant.address || restaurant.quartier || restaurant.city || ''}
          </Text>
        </View>
      </View>

      {/* Aménités + horaires du jour */}
      {!!restaurant.amenities?.length && (
        <View style={s.amenitiesRow}>
          {restaurant.amenities.map((a) => (
            <Tag key={a} variant={String(a).toLowerCase() === 'terrasse' ? 'amenityHighlight' : 'cuisineNeutral'}>
              {String(a).toUpperCase()}
            </Tag>
          ))}
        </View>
      )}
      <View style={s.hoursBanner}>
        {todaysRange ? (
          <>
            <Text style={s.hoursLabel}>{openNow === false ? 'Fermé actuellement' : "Ouvert aujourd'hui"}</Text>
            <Text style={s.hoursValue}>{todaysRange}</Text>
          </>
        ) : (
          <Text style={s.hoursValueMuted}>Horaires non renseignés</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {['Menu', 'Avis', 'Infos'].map(t => (
          <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnOn]} onPress={() => switchTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtOn]}>{t}</Text>
            {tab === t && <View style={s.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <Animated.ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, opacity: tabAnim }}>
        {tab === 'Menu' && <RestaurantMenuTab menu={menu} />}
        {tab === 'Avis' && <RestaurantAvisTab restaurant={restaurant} reviews={reviews} loadingReviews={loadingReviews} />}
        {tab === 'Infos' && <RestaurantInfosTab restaurant={restaurant} desc={desc} />}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerInner}>
          {restaurant.avg_ticket > 0 && (
            <View style={s.footerPrice}>
              <Text style={s.footerPriceLbl}>PRIX MOY.</Text>
              <Text style={s.footerPriceVal}>{restaurant.avg_ticket.toLocaleString('fr-FR')} DA</Text>
            </View>
          )}
          <TouchableOpacity style={s.directionsBtn} onPress={goDirections}>
            <Ionicons name="location" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.reserveBtn, !restaurant.avg_ticket && { flex: 1 }]}
            onPress={goReserve}
          >
            <Text style={s.reserveTxt}>Réserver une table</Text>
          </TouchableOpacity>
        </View>
        {clickCollectEnabled && (
          <TouchableOpacity style={s.clickCollectBtn} onPress={goClickCollect}>
            <Text style={s.clickCollectTxt}>Commander</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  // Infos resto — sous la photo (plus aucun texte sur l'image)
  infoBlock:    { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg, backgroundColor: colors.card },
  infoName:     { fontFamily: typography.display, fontSize: typography.size.title, color: colors.text, letterSpacing: -0.3, marginBottom: spacing.sm },
  infoMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  infoRating:   { fontFamily: typography.bodyBold, fontSize: typography.size.bodyLg, color: colors.gold },
  infoReviewCount: { fontFamily: typography.body, color: colors.textDim, fontSize: typography.size.caption },
  infoSep:      { color: colors.textDim },
  infoCuisine:  { fontFamily: typography.body, fontSize: typography.size.bodyLg - 0.5, color: colors.textMuted, flexShrink: 1 },
  infoAddrRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, marginTop: spacing.sm },
  infoAddr:     { fontFamily: typography.body, fontSize: typography.size.body, color: colors.textDim, flex: 1 },

  descWrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl - 2, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  descTxt:  { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 20, fontWeight: typography.weight.regular },

  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, backgroundColor: colors.card },
  hoursBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.lg,
    backgroundColor: colors.cream, borderRadius: radius.lg, paddingVertical: spacing.lg + 1, paddingHorizontal: 15,
  },
  hoursLabel: { fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg - 0.5, color: colors.text },
  hoursValue: { fontFamily: typography.bodySemibold, fontSize: typography.size.bodyLg - 0.5, color: colors.primary },
  hoursValueMuted: { fontFamily: typography.bodyMedium, fontSize: typography.size.bodyLg - 0.5, color: colors.textDim },

  tabBar:  { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabBtn:  { flex: 1, alignItems: 'center', paddingVertical: spacing.lg + 1, position: 'relative' },
  tabBtnOn:{ backgroundColor: colors.primarySoft },
  tabTxt:  { color: colors.textSecondary, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:{ color: colors.primary, fontWeight: typography.weight.semibold },
  tabLine: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: colors.primary, borderRadius: 1 },

  footer:        { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.card },
  footerInner:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2 },
  footerPrice:   { gap: spacing.xxs },
  footerPriceLbl:{ color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5 },
  footerPriceVal:{ color: colors.primary, fontSize: typography.size.heading2, fontWeight: typography.weight.medium },
  reserveBtn:    { flex: 1, borderRadius: radius.card, paddingVertical: spacing.xl - 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.resa },
  reserveTxt:    { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.bodyLg, letterSpacing: 0.3 },
  directionsBtn: { width: 52, paddingVertical: spacing.xl - 1, borderRadius: radius.card, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  clickCollectBtn: { marginTop: spacing.md, borderRadius: radius.card, paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenSoft },
  clickCollectTxt: { fontFamily: typography.bodySemibold, color: colors.green, fontSize: typography.size.bodyLg, letterSpacing: 0.2 },
});
