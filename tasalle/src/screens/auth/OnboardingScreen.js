import { useRef, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import MButton from '../../components/MButton';
import TasalleLogo from '../../components/TasalleLogo';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';

const SLIDES = [
  { key: 'slide1', icon: 'business-outline' },
  { key: 'slide2', icon: 'calendar-outline' },
  { key: 'slide3', icon: 'shield-checkmark-outline' },
];

export default function OnboardingScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      navigation.replace('Phone');
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg }}>
        <TasalleLogo size={32} />
        <Pressable onPress={() => navigation.replace('Phone')} hitSlop={8} accessibilityRole="button">
          <Text style={[typography.secondary, { color: colors.warmGray }]}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{ width, padding: spacing.xxl, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: radii.xxl,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={slide.icon} size={48} color={colors.primaryInk} />
            </View>

            <Text style={[typography.h2, { color: colors.dark, textAlign: 'center' }]}>
              {t(`onboarding.${slide.key}Title`)}
            </Text>
            <Text
              style={[typography.body, { color: colors.warmGray, textAlign: 'center', maxWidth: 340 }]}
            >
              {t(`onboarding.${slide.key}Body`)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={{
                width: i === index ? 20 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === index ? colors.primaryInk : colors.border,
              }}
            />
          ))}
        </View>

        <MButton
          label={index === SLIDES.length - 1 ? t('onboarding.start') : t('common.next')}
          onPress={goNext}
          size="lg"
          full
        />
      </View>
    </Screen>
  );
}
