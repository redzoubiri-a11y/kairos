import React, { useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../src/theme';
import Button from '../src/components/Button';
import { useT } from '../src/i18n';

const { width } = Dimensions.get('window');

const SLIDES = [
  { cle: 'slide1', icone: '💇' },
  { cle: 'slide2', icone: '📅' },
  { cle: 'slide3', icone: '✨' },
];

export default function OnboardingScreen({ navigation }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);

  const suivant = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      navigation.replace('Auth');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.cle}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.icone}>{item.icone}</Text>
            <Text style={styles.titre}>{t(`onboarding.${item.cle}Titre`)}</Text>
            <Text style={styles.message}>{t(`onboarding.${item.cle}Message`)}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActif]} />
        ))}
      </View>

      <Button
        title={t(index === SLIDES.length - 1 ? 'onboarding.commencer' : 'onboarding.suivant')}
        onPress={suivant}
        style={styles.bouton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  slide: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  icone: { fontSize: 64 },
  titre: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.secondary, textAlign: 'center' },
  message: { fontSize: typography.size.md, color: colors.textSecondary, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActif: { backgroundColor: colors.primary, width: 20 },
  bouton: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});
