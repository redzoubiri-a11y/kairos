import { useCallback } from 'react';
import {
  Platform, StatusBar as RNStatusBar, Dimensions,
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Animated, Share,
} from 'react-native';
import { colors, typography, spacing, radius } from '../src/theme';
import useRestaurant from '../src/hooks/useRestaurant';
import RestaurantMenuTab from '../src/components/RestaurantMenuTab';
import RestaurantAvisTab from '../src/components/RestaurantAvisTab';
import RestaurantInfosTab from '../src/components/RestaurantInfosTab';
import MidaLogo from '../src/components/MidaLogo';

const SW   = Dimensions.get('window').width;
const HERO = 310;
const TOP  = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 16;

function HeroGradient() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ flex: 1 }} />
      <View style={{ height: HERO * 0.08, backgroundColor: 'rgba(15,13,11,0.1)'  }} />
      <View style={{ height: HERO * 0.10, backgroundColor: 'rgba(15,13,11,0.25)' }} />
      <View style={{ height: HERO * 0.12, backgroundColor: 'rgba(15,13,11,0.45)' }} />
      <View style={{ height: HERO * 0.14, backgroundColor: 'rgba(15,13,11,0.65)' }} />
      <View style={{ height: HERO * 0.16, backgroundColor: 'rgba(15,13,11,0.85)' }} />
    </View>
  );
}

export default function RestaurantScreen({ route, navigation }) {
  const restaurant = route?.params?.restaurant || {
    name: 'Dar Zitoun', cuisine_type: 'algerien',
    address: 'Bab El Oued, Alger', quartier: 'Bab El Oued',
  };

  const {
    tab, photoIndex, setPhotoIndex,
    isFav, favLoading, reviews, loadingReviews,
    tabAnim, photos, menu, rating, cuisineEmoji, desc,
    toggleFav, switchTab,
  } = useRestaurant(restaurant);

  const goBack    = useCallback(() => navigation?.goBack(), [navigation]);
  const goReserve = useCallback(() => navigation.navigate('ReservationForm', { restaurant }), [navigation, restaurant]);
  const handleShare = useCallback(() => {
    Share.share({
      message: `🍽️ ${restaurant.name} sur MIDA\n${restaurant.address || ''}\n\nRéserve ta table : mida://restaurant/${restaurant.id}`,
      title: restaurant.name,
    });
  }, [restaurant]);

  return (
    <SafeAreaView style={s.root}>

      {/* Hero */}
      <View style={s.hero}>
        {photos ? (
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SW))}
          >
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={{ width: SW, height: HERO }} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 80, opacity: 0.5 }}>{cuisineEmoji}</Text>
          </View>
        )}

        <HeroGradient />

        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.heroBtnTxt}>←</Text>
        </TouchableOpacity>

        <MidaLogo showTagline={false} style={s.heroLogo} />

        <View style={s.heroBottomRight}>
          <TouchableOpacity style={s.sharePill} onPress={handleShare}>
            <Text style={s.shareTxt}>Partage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.favBtn} onPress={toggleFav} disabled={favLoading}>
            <Text style={favLoading ? s.heroBtnActing : s.heroBtnIcon}>
              {favLoading ? '···' : isFav ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.heroInfo}>
          <View style={s.heroTopRow}>
            <View style={s.heroCuisineBadge}>
              <Text style={s.heroCuisineEmoji}>{cuisineEmoji}</Text>
              <Text style={s.heroCuisineTxt}>{(restaurant.cuisine_type || '').replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <View style={s.openBadge}>
              <View style={s.openDot} />
              <Text style={s.openTxt}>Ouvert</Text>
            </View>
          </View>
          <Text style={s.heroName} numberOfLines={1}>{restaurant.name}</Text>
          <View style={s.heroMeta}>
            {rating && (
              <>
                <Text style={s.heroRatingTxt}>★ {rating}</Text>
                {restaurant.review_count > 0 && (
                  <Text style={s.heroReviewCount}>({restaurant.review_count} avis)</Text>
                )}
                <Text style={s.heroSep}>·</Text>
              </>
            )}
            <Text style={s.heroAddr} numberOfLines={1}>
              📍 {restaurant.quartier || restaurant.city || ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats strip */}
      <View style={s.strip}>
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>★</Text>
          <Text style={s.stripVal}>{rating || '—'}</Text>
          <Text style={s.stripLbl}>Note</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>💰</Text>
          <Text style={s.stripVal}>
            {restaurant.avg_ticket > 0 ? (restaurant.avg_ticket / 1000).toFixed(1) + 'k' : '—'}
          </Text>
          <Text style={s.stripLbl}>DA / pers.</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>🪑</Text>
          <Text style={s.stripVal}>{restaurant.capacity > 0 ? restaurant.capacity : '—'}</Text>
          <Text style={s.stripLbl}>Couverts</Text>
        </View>
        <View style={s.stripDiv} />
        <View style={s.stripItem}>
          <Text style={s.stripIcon}>💬</Text>
          <Text style={s.stripVal}>{reviews.length > 0 ? reviews.length : restaurant.review_count || '—'}</Text>
          <Text style={s.stripLbl}>Avis</Text>
        </View>
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
          <TouchableOpacity
            style={[s.reserveBtn, !restaurant.avg_ticket && { flex: 1 }]}
            onPress={goReserve}
          >
            <Text style={s.reserveTxt}>RÉSERVER UNE TABLE</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  hero:         { height: HERO, overflow: 'hidden' },
  heroBtn:      { position: 'absolute', top: TOP, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15,13,11,0.76)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,235,227,0.12)' },
  backBtn:      { position: 'absolute', bottom: spacing.xl, left: spacing.xl, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(15,13,11,0.72)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,235,227,0.12)' },
  heroLogo:     { position: 'absolute', top: TOP + 2, alignSelf: 'center', left: 0, right: 0 },
  heroBtnTxt:   { color: colors.text, fontSize: typography.size.heading1 },
  heroBtnIcon:  { fontSize: typography.size.heading1 },
  heroBtnActing:{ color: colors.accent, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },

  heroBottomRight: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  favBtn:          { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(15,13,11,0.72)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,235,227,0.12)' },
  sharePill:    { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  shareTxt:     { color: 'rgba(240,235,227,0.75)', fontSize: typography.size.caption, fontWeight: typography.weight.regular, letterSpacing: 2 },


  openBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, backgroundColor: 'rgba(15,13,11,0.76)', borderRadius: radius.full, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  openDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  openTxt:   { color: colors.green, fontSize: typography.size.sm },

  heroInfo:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, paddingBottom: spacing.xl + 2 },
  heroTopRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  heroCuisineBadge:{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, backgroundColor: colors.accentSoft, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(232,160,69,0.4)', paddingHorizontal: spacing.md + 1, paddingVertical: spacing.xs },
  heroCuisineEmoji:{ fontSize: typography.size.body },
  heroCuisineTxt:  { color: colors.accent, fontSize: typography.size.xs, letterSpacing: 2.5 },
  heroName:        { color: colors.text, fontSize: typography.size.title + 4, fontWeight: typography.weight.regular, letterSpacing: 0.3, marginBottom: spacing.sm + 1 },
  heroMeta:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 1, flexWrap: 'wrap' },
  heroRatingTxt:   { color: colors.accent, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium },
  heroReviewCount: { color: colors.textMuted, fontSize: typography.size.caption },
  heroSep:         { color: colors.textDim },
  heroAddr:        { color: colors.textMuted, fontSize: typography.size.body, flex: 1 },

  strip:     { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg - 1, gap: spacing.xxs },
  stripIcon: { fontSize: typography.size.bodyLg, marginBottom: spacing.xxs },
  stripVal:  { color: colors.text, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  stripLbl:  { color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 0.3 },
  stripDiv:  { width: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.md },

  descWrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xl - 2, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  descTxt:  { color: colors.textMuted, fontSize: typography.size.bodyLg, lineHeight: 20, fontWeight: typography.weight.regular },

  tabBar:  { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  tabBtn:  { flex: 1, alignItems: 'center', paddingVertical: spacing.lg + 1, position: 'relative' },
  tabBtnOn:{ backgroundColor: colors.accentSoft, shadowColor: colors.accent, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  tabTxt:  { color: colors.textDim, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:{ color: colors.accent, fontWeight: typography.weight.semibold },
  tabLine: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: colors.accent, borderRadius: 1 },

  footer:        { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.bg },
  footerInner:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2 },
  footerPrice:   { gap: spacing.xxs },
  footerPriceLbl:{ color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5 },
  footerPriceVal:{ color: colors.accent, fontSize: typography.size.heading2, fontWeight: typography.weight.regular },
  reserveBtn:    { flex: 1, backgroundColor: colors.accent, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, alignItems: 'center' },
  reserveTxt:    { color: colors.bg, fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },
});
