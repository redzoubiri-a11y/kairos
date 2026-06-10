import { useCallback } from 'react';
import {
  Platform, StatusBar as RNStatusBar, Dimensions,
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../src/theme';
import useRestaurant from '../src/hooks/useRestaurant';
import RestaurantMenuTab from '../src/components/RestaurantMenuTab';
import RestaurantAvisTab from '../src/components/RestaurantAvisTab';
import RestaurantInfosTab from '../src/components/RestaurantInfosTab';
import BottomTabBar from '../src/components/BottomTabBar';

const SW   = Dimensions.get('window').width;
const HERO = 310;
const TOP  = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 10 : 16;

function HeroGradient() {
  return (
    <>
      <LinearGradient
        colors={['rgba(0,0,0,0.80)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO * 0.38 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.88)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO * 0.60 }}
        pointerEvents="none"
      />
    </>
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

  const goReserve = useCallback(() => navigation.navigate('ReservationForm', { restaurant }), [navigation, restaurant]);
  const handleShare = useCallback(() => {
    Share.share({
      message: `🍽️ ${restaurant.name} sur MIDA\n${restaurant.address || ''}\n\nRéserve ta table : mida://restaurant/${restaurant.id}`,
      title: restaurant.name,
    });
  }, [restaurant]);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#C4B8C8', '#8B9BB4', '#6B7F9E']} start={{ x: 0.2, y: 0 }} end={{ x: 0, y: 1 }} style={s.bgOverlay} pointerEvents="none" />

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

        <TouchableOpacity style={s.heroBackBtn} onPress={() => navigation.goBack()}>
          <Text style={s.heroBackBtnTxt}>←</Text>
        </TouchableOpacity>

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
            <LinearGradient colors={['#FF6B1A','#D93A00']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFillObject} />
            <Text style={s.reserveTxt}>RÉSERVER UNE TABLE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BottomTabBar navigation={navigation} activeTab={null} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  hero:         { height: HERO, overflow: 'hidden' },
  heroLogo:     { position: 'absolute', top: TOP + 2, alignSelf: 'center', left: 0, right: 0 },
  heroBtnTxt:   { color: '#FFFFFF', fontSize: typography.size.heading1, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroBtnIcon:  { fontSize: typography.size.heading1 },
  heroBtnActing:{ color: colors.accent, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold },

  heroBackBtn:     { position: 'absolute', top: TOP, left: spacing.xl, width: 40, height: 40, borderRadius: 0, backgroundColor: 'rgba(15,13,11,0.72)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,235,227,0.12)' },
  heroBackBtnTxt:  { color: 'rgba(240,235,227,0.9)', fontSize: 22, lineHeight: 26 },
  heroBottomRight: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  favBtn:          { width: 44, height: 44, borderRadius: 0, backgroundColor: 'rgba(15,13,11,0.72)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(240,235,227,0.12)' },
  sharePill:    { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 0, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  shareTxt:     { color: 'rgba(240,235,227,0.75)', fontSize: typography.size.caption, fontWeight: typography.weight.regular, letterSpacing: 2 },


  openBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 1, backgroundColor: 'rgba(15,13,11,0.76)', borderRadius: radius.full, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(76,175,130,0.3)' },
  openDot:   { width: 6, height: 6, borderRadius: 0, backgroundColor: colors.green },
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
  tabBtnOn:{ backgroundColor: 'rgba(200,151,90,0.12)', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  tabTxt:  { color: colors.textDim, fontSize: typography.size.bodyLg, fontWeight: typography.weight.regular },
  tabTxtOn:{ color: colors.accent, fontWeight: typography.weight.semibold },
  tabLine: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: colors.accent, borderRadius: 0 },

  footer:        { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.navy },
  footerInner:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xl - 2 },
  footerPrice:   { gap: spacing.xxs },
  footerPriceLbl:{ color: colors.textDim, fontSize: typography.size.xs, letterSpacing: 1.5 },
  footerPriceVal:{ color: colors.accent, fontSize: typography.size.heading2, fontWeight: typography.weight.regular },
  reserveBtn:    { flex: 1, borderRadius: radius.xl, paddingVertical: spacing.xl - 1, alignItems: 'center', overflow: 'hidden', justifyContent: 'center' },
  reserveTxt:    { color: '#FFFFFF', fontSize: typography.size.bodyLg, fontWeight: typography.weight.medium, letterSpacing: 1.5 },
});
