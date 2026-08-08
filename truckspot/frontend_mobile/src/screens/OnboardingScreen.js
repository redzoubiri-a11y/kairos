import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography } from '../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'map',
    icon: 'map',
    title: 'Trouvez un camion pres de vous',
    body: "Visualisez en temps reel les camions disponibles autour de votre position et le volume qu'ils peuvent encore charger.",
  },
  {
    key: 'mission',
    icon: 'send',
    title: 'Envoyez votre mission',
    body: 'Decrivez votre marchandise, le point de chargement et de livraison, puis envoyez la demande au transporteur en un geste.',
  },
  {
    key: 'chat',
    icon: 'chatbubbles',
    title: 'Suivez et discutez',
    body: "Discutez directement avec le transporteur, suivez l'avancement de la mission et gardez tout l'historique.",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={56} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button title={isLast ? 'Commencer' : 'Suivant'} onPress={goNext} />
        {!isLast ? (
          <Button title="Passer" variant="ghost" onPress={completeOnboarding} style={styles.skip} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: { ...typography.h1, color: colors.textInverse, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textOnDark,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 23,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xl },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderDark,
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  skip: { marginTop: spacing.sm },
});
