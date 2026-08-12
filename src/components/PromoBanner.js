import { useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../theme';
import usePromoCarousel from '../hooks/usePromoCarousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const LOOP_MULTIPLIER = 50;

export default function PromoBanner({ slides, onPressSlide }) {
  const { listRef, startIndex, activeIndex, onManualScroll } = usePromoCarousel(slides.length);

  // Data multipliée pour simuler la boucle infinie (jamais de retour visuel au début)
  const loopedSlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    return Array.from({ length: LOOP_MULTIPLIER }).flatMap((_, loop) =>
      slides.map((slide, i) => ({ ...slide, _key: `${loop}-${i}` }))
    );
  }, [slides]);

  const handleMomentumEnd = (e) => {
    const rawIdx = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    onManualScroll(rawIdx);
  };

  const getItemLayout = (_, index) => ({
    length: SLIDE_WIDTH,
    offset: SLIDE_WIDTH * index,
    index,
  });

  return (
    <View style={s.wrap}>
      <FlatList
        ref={listRef}
        data={loopedSlides}
        keyExtractor={(item) => item._key ?? item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={slides.length > 1 ? startIndex : 0}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={getItemLayout}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onPressSlide?.(item)}
            style={s.slideShadow}
          >
            <LinearGradient
              colors={['#1a8f5f', '#0D6B3F', '#0a4f2f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.slide}
            >
              <View style={s.pubBadge}>
                <Text style={s.pubBadgeTxt}>PUB</Text>
              </View>
              <Text style={s.title}>{item.title}</Text>
              <View style={s.ctaPill}>
                <Text style={s.ctaTxt}>{item.ctaLabel}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />

      {slides.length > 1 && (
        <View style={s.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[s.dot, i === activeIndex && s.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  slideShadow: { width: SLIDE_WIDTH, borderRadius: radius.lg, ...shadows.md },
  slide: {
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  pubBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(10,10,10,0.25)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.md,
  },
  pubBadgeTxt: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: typography.size.xs, letterSpacing: 1.5 },
  title: {
    fontFamily: typography.display,
    fontSize: typography.size.title,
    color: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  ctaPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  ctaTxt: { fontFamily: typography.bodyBold, color: '#0D6B3F', fontSize: typography.size.subheading },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3, backgroundColor: colors.cardBorder },
  dotActive: { width: 16, backgroundColor: '#0D6B3F' },
});
